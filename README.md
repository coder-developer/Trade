# AI Crypto Bot Manager - ML Optimized (v4.0)

Ứng dụng bot trading tự động sử dụng Machine Learning để tối ưu hóa lợi nhuận thông qua giao dịch chênh lệch giá (Arbitrage) và quản lý đa ví.

## Tính năng chính
- **Multi-Wallet Engine**: Quản lý song song 10 ví trading (5 USDT/ví).
- **Arb Scanning**: Quét chênh lệch giá giữa Binance (CEX) và PolyMarket.
- **AI/ML Analysis**: Tích hợp Gemini AI để đưa ra chiến lược bằng tiếng Việt.
- **Auto-Withdraw**: Tự động rút tiền về ví chính khi đạt mục tiêu 100 USDT lợi nhuận.
- **Risk Management**: Cài đặt Stop Loss linh hoạt và bảo mật ví ngoài.

## Hướng dẫn Cài đặt & Chạy Local

### 1. Yêu cầu hệ thống
- Node.js (v18 trở lên)
- NPM hoặc Yarn

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```env
GEMINI_API_KEY=your_api_key_here
```
*Lấy khóa API tại: https://aistudio.google.com/app/apikey*

### 4. Chạy chế độ Development
```bash
npm run dev
```
Truy cập: `http://localhost:3000`

## Hướng dẫn Triển khai (Deployment)

### Lựa chọn 1: Render / Vercel (Dễ nhất)
1. Kết nối kho lưu trữ GitHub của bạn với Render hoặc Vercel.
2. Cấu hình **Build Command**: `npm run build`
3. Cấu hình **Start Command**: `npm run start`
4. Thêm Environment Variable: `GEMINI_API_KEY`

### Lựa chọn 2: Docker / VPS
1. Build image: `docker build -t crypto-bot .`
2. Chạy container: `docker run -p 3000:3000 -e GEMINI_API_KEY=... crypto-bot`

## Cấu trúc thư mục
- `server.ts`: Logic Backend, quản lý ví và simulator giao dịch.
- `src/App.tsx`: Giao diện người dùng (Dashboard) thời gian thực.
- `src/lib/api.ts`: Kết nối Frontend và Backend API.
