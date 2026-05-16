import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// --- Mock Data & Simulator Logic ---

const SYMBOLS = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOT", "DOGE", "AVAX", "MATIC", "LINK"];
const initialPrices: Record<string, number> = {
  BTC: 65000,
  ETH: 3500,
  SOL: 140,
  XRP: 0.6,
  ADA: 0.45,
  DOT: 7.2,
  DOGE: 0.15,
  AVAX: 35,
  MATIC: 0.7,
  LINK: 18,
};

let currentPrices = { ...initialPrices };
let polyPrices = { ...initialPrices }; // Polymarket prices (slightly different)
let tradeHistory: any[] = [];
let botRunning = false;

// Main Wallet to receive profits
let mainWallet = {
  id: 'main_wallet',
  name: 'Ví Chính (Main)',
  balance: 0,
  address: '0xMAIN_FUNDS_COLLECTOR'
};

// 10 Wallets (Start with 5 USDT)
let wallets = Array.from({ length: 10 }, (_, i) => ({
  id: `wallet_${i + 1}`,
  name: `Wallet ${i + 1}`,
  type: i < 5 ? 'EXCHANGE' : 'EXTERNAL',
  address: i < 5 ? null : `0x${Math.random().toString(16).slice(2, 42)}`,
  initialBalance: 5,
  balance: 5, // 5 USDT as requested
  assets: {} as Record<string, { amount: number, avgPrice: number }>,
  stopLoss: 5, // 5% default stop loss
  totalProfit: 0,
  lastTrade: null as any,
  reachedTarget: false, // Flag to stop trading
}));

// Simulate price fluctuations
setInterval(() => {
  if (!botRunning) return;

  SYMBOLS.forEach(symbol => {
    // Exchange price change
    const change = (Math.random() - 0.5) * 0.002; 
    currentPrices[symbol] *= (1 + change);

    // Polymarket price - lags or leads slightly, creating arb opportunities
    const polyChange = (Math.random() - 0.5) * 0.005; 
    polyPrices[symbol] = currentPrices[symbol] * (1 + polyChange);
  });

  // Trading logic
  wallets.forEach(wallet => {
    if (wallet.reachedTarget) return; // Stop if target reached

    // Check Profit Target (100 USDT profit)
    // Profit = (Current Balance + Current Assets Value) - Initial Balance
    const currentAssetsValue = Object.entries(wallet.assets).reduce((acc, [sym, data]) => {
      return acc + (data.amount * currentPrices[sym]);
    }, 0);
    
    wallet.totalProfit = (wallet.balance + currentAssetsValue) - wallet.initialBalance;

    if (wallet.totalProfit >= 100) {
      // TARGET REACHED: Withdraw all to Main Wallet
      const totalToWithdraw = wallet.balance + currentAssetsValue;
      
      // Liquidate all assets first
      Object.keys(wallet.assets).forEach(sym => {
        wallet.assets[sym] = { amount: 0, avgPrice: 0 };
      });
      
      mainWallet.balance += totalToWithdraw;
      wallet.balance = 0;
      wallet.reachedTarget = true;
      
      const trade = {
        id: `WITHDRAW_${Math.random().toString(36).substring(7)}`,
        walletId: wallet.id,
        walletName: wallet.name,
        type: 'WITHDRAW',
        symbol: 'USDT',
        amount: totalToWithdraw,
        price: 1,
        timestamp: new Date().toISOString(),
      };
      wallet.lastTrade = trade;
      tradeHistory.unshift(trade);
      return;
    }

    // 1. Check Stop Losses first
    Object.entries(wallet.assets).forEach(([symbol, data]: [string, any]) => {
      if (data.amount <= 0) return;
      
      const currentPrice = currentPrices[symbol];
      const lossPercent = ((data.avgPrice - currentPrice) / data.avgPrice) * 100;

      if (lossPercent >= wallet.stopLoss) {
        // STOP LOSS TRIGGERED
        const sellAmount = data.amount;
        wallet.balance += sellAmount * currentPrice;
        wallet.assets[symbol] = { amount: 0, avgPrice: 0 };
        
        const trade = {
          id: `SL_${Math.random().toString(36).substring(7)}`,
          walletId: wallet.id,
          walletName: wallet.name,
          type: 'SELL',
          subtype: 'STOP_LOSS',
          symbol,
          amount: sellAmount,
          price: currentPrice,
          timestamp: new Date().toISOString(),
        };
        wallet.lastTrade = trade;
        tradeHistory.unshift(trade);
      }
    });

    // 2. Arbitrage Check (Exch -> Poly)
    SYMBOLS.forEach(symbol => {
      const exchPrice = currentPrices[symbol];
      const polyPrice = polyPrices[symbol];
      const diffPercent = ((polyPrice - exchPrice) / exchPrice) * 100;

      // If Poly is 1% higher than Exchange, Arb opportunity
      if (diffPercent > 1.0 && wallet.balance > exchPrice) {
        const buyAmount = (wallet.balance * 0.2) / exchPrice;
        wallet.balance -= buyAmount * exchPrice;
        
        // Instant Arb Simulation: Buy on Exchange, simulated sell on Poly for profit
        const profit = buyAmount * (polyPrice - exchPrice);
        wallet.balance += buyAmount * polyPrice; // Return capital + profit
        
        const trade = {
          id: `ARB_${Math.random().toString(36).substring(7)}`,
          walletId: wallet.id,
          walletName: wallet.name,
          type: 'ARB',
          symbol,
          amount: buyAmount,
          buyPrice: exchPrice,
          sellPrice: polyPrice,
          profit,
          timestamp: new Date().toISOString(),
        };
        wallet.lastTrade = trade;
        tradeHistory.unshift(trade);
      }
    });

    // Random noise trade (keep original logic loosely)
    if (Math.random() < 0.02) {
      const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const price = currentPrices[symbol];
      if (wallet.balance > price) {
        const amount = (wallet.balance * 0.05) / price;
        wallet.balance -= amount * price;
        const currentAmount = wallet.assets[symbol]?.amount || 0;
        const currentAvg = wallet.assets[symbol]?.avgPrice || 0;
        
        const newAmount = currentAmount + amount;
        const newAvg = ((currentAmount * currentAvg) + (amount * price)) / newAmount;
        
        wallet.assets[symbol] = { amount: newAmount, avgPrice: newAvg };
        
        const trade = {
          id: Math.random().toString(36).substring(7),
          walletId: wallet.id,
          walletName: wallet.name,
          type: 'BUY',
          symbol,
          amount,
          price,
          timestamp: new Date().toISOString(),
        };
        wallet.lastTrade = trade;
        tradeHistory.unshift(trade);
      }
    }

    if (tradeHistory.length > 50) tradeHistory.pop();
  });
}, 2000);

// --- API Routes ---

app.get("/api/status", (req, res) => {
  res.json({
    botRunning,
    currentPrices,
    polyPrices,
    mainWallet, // Include this
    wallets,
    tradeHistory: tradeHistory.slice(0, 30),
  });
});

app.post("/api/wallet/import", (req, res) => {
  const { name, address, type } = req.body;
  const newWallet = {
    id: `wallet_${wallets.length + 1}`,
    name: name || `Imported Wallet ${wallets.length + 1}`,
    type: type || 'EXTERNAL',
    address: address || `0x${Math.random().toString(16).slice(2, 42)}`,
    initialBalance: 5,
    balance: 1000 + Math.random() * 9000,
    assets: {} as Record<string, { amount: number, avgPrice: number }>,
    stopLoss: 5,
    totalProfit: 0,
    lastTrade: null as any,
    reachedTarget: false,
  };
  wallets.push(newWallet);
  res.json(newWallet);
});

app.post("/api/wallet/config", (req, res) => {
  const { walletId, stopLoss } = req.body;
  const wallet = wallets.find(w => w.id === walletId);
  if (wallet) {
    wallet.stopLoss = stopLoss;
    res.json(wallet);
  } else {
    res.status(404).json({ error: "Wallet not found" });
  }
});

app.post("/api/bot/toggle", (req, res) => {
  botRunning = !botRunning;
  res.json({ botRunning });
});

app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { marketData } = req.body;
    
    // In a real scenario, you'd fetch real news/sentiment. 
    // Here we use Gemini to provide a "strategy" based on simulated data.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là một chuyên gia tối ưu hóa bot trading sử dụng học máy (Machine Learning). Dựa trên dữ liệu thị trường hiện tại: ${JSON.stringify(marketData)}, hãy cung cấp một phân tích chiến lược ngắn gọn (2-3 câu) bằng tiếng Việt để tối ưu hóa lợi nhuận và chọn một đồng coin để 'Theo dõi sát' trong giờ tới. Trả về định dạng JSON: { "insight": "...", "topPick": "...", "sentiment": "Bullish/Bearish/Neutral" }`,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: "Failed to get AI insight" });
  }
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
