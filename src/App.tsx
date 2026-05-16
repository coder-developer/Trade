/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Wallet, 
  History, 
  Settings, 
  Play, 
  Square,
  RefreshCw,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Plus,
  ShieldCheck,
  Percent,
  Link as LinkIcon,
  Search
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { getStatus, toggleBot, getAIAnalysis, importWallet, updateWalletConfig } from './lib/api';
import { cn } from './lib/utils';

export default function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await getStatus();
      setData(res);
      const totalBalance = res.wallets.reduce((acc: number, w: any) => acc + w.balance, 0);
      setHistoryData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), balance: totalBalance }];
        return newData.slice(-40);
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    try {
      const res = await toggleBot();
      setData((prev: any) => ({ ...prev, botRunning: res.botRunning }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIAnalyze = async () => {
    if (!data) return;
    setAnalyzing(true);
    try {
      const res = await getAIAnalysis(data.currentPrices);
      setAiInsight(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const onImportWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const wData = {
      name: formData.get('name'),
      address: formData.get('address'),
      type: 'EXTERNAL'
    };
    try {
      await importWallet(wData);
      setShowImportModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const onUpdateStopLoss = async (walletId: string, val: number) => {
    try {
      await updateWalletConfig({ walletId, stopLoss: val });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RefreshCw size={48} className="text-indigo-500 mb-4" />
        </motion.div>
        <p className="font-mono text-sm tracking-widest animate-pulse">ĐANG KẾT NỐI VỚI CÁC NÚT L1...</p>
      </div>
    );
  }

  const totalPortfolioValue = data.wallets.reduce((acc: number, w: any) => acc + w.balance, 0) + (data.mainWallet?.balance || 0);
  const activeWalletsCount = data.wallets.filter((w: any) => !w.reachedTarget && Object.values(w.assets).some((a: any) => a.amount > 0)).length;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-indigo-600 text-white text-[10px] font-bold py-1 px-4 text-center tracking-[0.2em] uppercase">
        Động cơ chênh lệch PolyMarket v4.0 • Mục tiêu: 100 USDT • Lợi nhuận chính: ${data.mainWallet?.balance.toFixed(2)}
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3">
              <Zap className="text-indigo-500 fill-indigo-500" />
              <h1 className="text-2xl font-black tracking-tighter uppercase skew-x-[-10deg]">
                Hệ thống<span className="text-indigo-500">ML Optim</span> AI
              </h1>
            </div>
            <p className="text-gray-600 mt-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} /> Giao dịch chênh lệch đa sàn (Target 100 USDT)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleAIAnalyze}
              disabled={analyzing}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all disabled:opacity-50"
            >
              <Cpu size={16} className={analyzing ? "animate-spin" : "group-hover:rotate-12"} />
              <span className="text-xs font-bold uppercase tracking-tight">{analyzing ? "Đang xử lý..." : "Phân tích ML"}</span>
            </button>

            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <Plus size={16} />
              <span className="text-xs font-bold uppercase">Nhập Ví</span>
            </button>
            
            <button 
              onClick={handleToggle}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg font-black tracking-tighter transition-all border-b-4 active:border-b-0 active:translate-y-1",
                data.botRunning 
                  ? "bg-red-600 border-red-800 text-white" 
                  : "bg-emerald-500 border-emerald-700 text-white"
              )}
            >
              {data.botRunning ? <><Square size={16} fill="white" /> DỪNG BOT</> : <><Play size={16} fill="white" /> CHẠY BOT</>}
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Tổng Tài Sản" value={`$${totalPortfolioValue.toLocaleString()}`} icon={<Wallet className="text-indigo-400" />} />
          <StatCard label="Ví Đã Đạt Mục Tiêu" value={data.wallets.filter((w:any)=>w.reachedTarget).length} sub="Profit > 100 USD" icon={<ShieldCheck className="text-emerald-400" />} />
          <StatCard label="Số Dư Ví Chính" value={`$${data.mainWallet?.balance.toLocaleString()}`} icon={<ArrowUpRight className="text-yellow-400" />} />
          <StatCard label="Trạng Thái Bot" value={data.botRunning ? "ON" : "OFF"} sub="Hệ thống ổn định" icon={<Activity className="text-blue-400" />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Monitor */}
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-[#0e0e0e] border border-white/5 rounded-xl p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp size={200} />
              </div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold font-mono text-gray-500 uppercase tracking-widest">Hiệu suất Hệ thống</h3>
                <div className="flex gap-4 font-mono text-[10px]">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-indigo-500" /> TỔNG VỐN + LÃI</div>
                </div>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '4px', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Arb Scanner & Wallet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Arb Scanner */}
               <div className="bg-[#0e0e0e] border border-white/5 rounded-xl p-5">
                 <h3 className="text-[10px] font-bold text-gray-500 mb-5 uppercase tracking-widest flex items-center gap-2">
                   <Zap size={14} className="text-indigo-400" /> Máy quét Chênh lệch
                 </h3>
                 <div className="space-y-3">
                   {Object.keys(data.currentPrices).slice(0,6).map(sym => {
                     const cex = data.currentPrices[sym];
                     const poly = data.polyPrices[sym];
                     const diff = ((poly - cex) / cex) * 100;
                     return (
                       <div key={sym} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                         <div className="font-bold text-xs uppercase">{sym}</div>
                         <div className="flex-1 px-4">
                           <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                className={cn("h-full rounded-full", diff > 0 ? "bg-emerald-500" : "bg-red-500")}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(Math.abs(diff) * 20, 100)}%` }}
                              />
                           </div>
                         </div>
                         <div className={cn("font-mono text-[10px] font-bold", diff > 0.5 ? "text-emerald-400" : "text-gray-500")}>
                           {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>

               {/* Wallet Summary */}
               <div className="bg-[#0e0e0e] border border-white/5 rounded-xl p-5">
                  <h3 className="text-[10px] font-bold text-gray-500 mb-5 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={14} className="text-indigo-400" /> Fleet 10 Ví (Init: 5$)
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {data.wallets.map((w: any) => (
                      <div 
                        key={w.id} 
                        onClick={() => setSelectedWalletId(selectedWalletId === w.id ? null : w.id)}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden",
                          w.reachedTarget ? "bg-emerald-500/10 border-emerald-500/40" : selectedWalletId === w.id ? "bg-indigo-500/10 border-indigo-500/40" : "bg-white/5 border-white/5"
                        )}
                      >
                        {w.reachedTarget && (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] font-bold px-2 py-0.5 rounded-bl">HOÀN THÀNH</div>
                        )}
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] font-mono text-gray-500">{w.type === 'EXCHANGE' ? 'NỘI BỘ' : 'BÊN NGOÀI'}</p>
                            <p className="text-xs font-bold leading-none">{w.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono">${w.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            <p className={cn("text-[8px] font-bold", w.totalProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {w.totalProfit >= 0 ? '+' : ''}{w.totalProfit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {selectedWalletId === w.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-4 border-t border-white/5 mt-3 space-y-3">
                             <div className="flex items-center justify-between">
                               <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><ShieldCheck size={10} /> Dừng lỗ</span>
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="range" min="1" max="10" value={w.stopLoss} 
                                   onChange={(e) => onUpdateStopLoss(w.id, parseInt(e.target.value))}
                                   className="w-20"
                                   disabled={w.reachedTarget}
                                 />
                                 <span className="text-[10px] font-bold text-indigo-400">{w.stopLoss}%</span>
                               </div>
                             </div>
                             {w.address && (
                                <div className="p-2 rounded bg-black/40 text-[8px] font-mono break-all text-gray-500 border border-white/5">
                                  {w.address}
                                </div>
                             )}
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-6">
            {/* AI Insights */}
            <div className="bg-indigo-600 rounded-xl p-6 text-white relative overflow-hidden group shadow-[0_0_40px_rgba(79,70,229,0.3)]">
               <div className="absolute top-0 right-0 p-4 transform group-hover:scale-110 transition-transform">
                  <Cpu size={80} className="opacity-10" />
               </div>
               <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Cpu size={14} /> Trí tuệ ML Optim
               </h3>
               {aiInsight ? (
                 <div className="space-y-4">
                   <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded font-bold">
                      {aiInsight.sentiment === 'Bullish' ? 'TĂNG TRƯỞNG' : aiInsight.sentiment === 'Bearish' ? 'GIẢM GIÁ' : 'TRUNG LẬP'}
                    </span>
                    {aiInsight.sentiment === 'Bullish' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                   </div>
                   <p className="text-sm font-medium leading-relaxed italic opacity-90">
                     "{aiInsight.insight}"
                   </p>
                   <div className="pt-2">
                     <p className="text-[9px] uppercase tracking-widest opacity-60">Mục tiêu giờ tới</p>
                     <p className="text-3xl font-black">{aiInsight.topPick}</p>
                   </div>
                 </div>
               ) : (
                 <div className="py-6 border-2 border-white/20 border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
                    <p className="text-[10px] font-bold opacity-70">AWAITING FEED...</p>
                    <button onClick={handleAIAnalyze} className="text-[9px] bg-white text-indigo-600 px-3 py-1 rounded-full font-bold hover:scale-105 transition-transform">PHÂN TÍCH</button>
                 </div>
               )}
            </div>

            {/* Live Feed */}
            <div className="bg-[#0e0e0e] border border-white/5 rounded-xl p-5">
              <h3 className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                <History size={14} className="text-indigo-400" /> Nhật ký Giao dịch
              </h3>
              <div className="space-y-4 h-[500px] overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence initial={false}>
                  {data.tradeHistory.map((t: any) => (
                    <motion.div 
                      key={t.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-3 rounded bg-white/[0.02] border-l-2 text-[10px]",
                        t.type === 'WITHDRAW' ? "border-indigo-500" : "border-white/10"
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn(
                          "font-bold uppercase tracking-tighter px-1",
                          t.type === 'WITHDRAW' ? "text-indigo-400 bg-indigo-500/10" : t.type === 'ARB' ? "text-yellow-400" : t.type === 'BUY' ? "text-emerald-400" : t.type === 'SELL' ? "text-red-400" : "text-gray-400"
                        )}>
                          {t.type === 'WITHDRAW' ? 'RÚT VỀ VÍ CHÍNH' : t.type === 'ARB' ? 'CHÊNH LỆCH GIÁ' : t.subtype === 'STOP_LOSS' ? 'CẮT LỖ' : t.type === 'BUY' ? 'MUA' : 'BÁN'}
                        </span>
                        <span className="text-gray-600">{new Date(t.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">{t.symbol}</span>
                        {t.type === 'ARB' ? (
                          <span className="text-emerald-400 font-mono">LỢI NHUẬN: +${t.profit.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">${(t.amount * (t.price || t.buyPrice)).toFixed(2)}</span>
                        )}
                      </div>
                      <p className="text-[8px] text-gray-600 mt-1 uppercase font-mono">{t.walletName} • {t.id}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Simplified */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0e0e0e] border border-indigo-500/30 rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LinkIcon className="text-indigo-500" /> NHẬP VÍ TRADE</h2>
            <form onSubmit={onImportWallet} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Tên Ví</label>
                <input name="name" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" placeholder="Ví Cá Nhân 01" required />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Địa chỉ Ví (L1/L2)</label>
                <input name="address" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none font-mono" placeholder="0x..." required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowImportModal(false)} className="flex-1 py-3 text-xs font-bold uppercase text-gray-500 hover:text-white">Hủy bỏ</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 rounded-lg text-xs font-bold uppercase hover:bg-indigo-700 transition-colors">Kết nối Ví</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: any, sub?: string, icon: any }) {
  return (
    <div className="bg-[#0e0e0e] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex items-center gap-4 group">
      <div className="p-3 rounded-lg bg-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-[9px] text-gray-600 font-mono italic">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
