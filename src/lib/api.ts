import axios from 'axios';

export const getStatus = async () => {
  const response = await axios.get('/api/status');
  return response.data;
};

export const toggleBot = async () => {
  const response = await axios.post('/api/bot/toggle');
  return response.data;
};

export const getAIAnalysis = async (marketData: any) => {
  const response = await axios.post('/api/ai/analyze', { marketData });
  return response.data;
};

export const importWallet = async (walletData: any) => {
  const response = await axios.post('/api/wallet/import', walletData);
  return response.data;
};

export const updateWalletConfig = async (config: any) => {
  const response = await axios.post('/api/wallet/config', config);
  return response.data;
};
