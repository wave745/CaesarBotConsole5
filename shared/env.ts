// Environment variables configuration
export const ENV = {
  // API Keys - Use import.meta.env for client-side access
  HELIUS_API_KEY: typeof window !== 'undefined' ? import.meta.env.VITE_HELIUS_API_KEY : process.env.HELIUS_API_KEY || '',
  OPENAI_API_KEY: typeof window !== 'undefined' ? import.meta.env.VITE_OPENAI_API_KEY : process.env.OPENAI_API_KEY || '',
  RUGCHECK_API_KEY: typeof window !== 'undefined' ? import.meta.env.VITE_RUGCHECK_API_KEY : process.env.RUGCHECK_API_KEY || '',
  SUPABASE_URL: typeof window !== 'undefined' ? import.meta.env.VITE_SUPABASE_URL : process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: typeof window !== 'undefined' ? import.meta.env.VITE_SUPABASE_ANON_KEY : process.env.SUPABASE_ANON_KEY || '',
  BIRDEYE_API_KEY: typeof window !== 'undefined' ? import.meta.env.VITE_BIRDEYE_API_KEY : process.env.BIRDEYE_API_KEY || '',
  JUPITER_API_KEY: typeof window !== 'undefined' ? import.meta.env.VITE_JUPITER_API_KEY : process.env.JUPITER_API_KEY || '',
  PUMPPORTAL_API_KEY: typeof window !== 'undefined' ? import.meta.env.VITE_PUMPPORTAL_API_KEY : process.env.PUMPPORTAL_API_KEY || '',
  
  // RPC Endpoints
  JITO_RPC: typeof window !== 'undefined' ? import.meta.env.VITE_JITO_RPC : process.env.JITO_RPC || 'https://mainnet.jito.bundle',
  HELIUS_RPC: (() => {
    const key = typeof window !== 'undefined' ? import.meta.env.VITE_HELIUS_API_KEY : process.env.HELIUS_API_KEY;
    return `https://rpc.helius.xyz/?api-key=${key}`;
  })(),
  
  // API Endpoints
  BIRDEYE_API: 'https://public-api.birdeye.so',
  DEXSCREENER_API: 'https://api.dexscreener.com/latest',
  RUGCHECK_API: 'https://api.rugcheck.xyz',
  JUPITER_API: 'https://quote-api.jup.ag/v6',
  PUMPFUN_API: 'https://api.pump.fun',
  
  // Network
  NETWORK: process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet',
  
  // Validation
  isConfigured: () => {
    const heliusKey = typeof window !== 'undefined' ? import.meta.env.VITE_HELIUS_API_KEY : process.env.HELIUS_API_KEY;
    const openaiKey = typeof window !== 'undefined' ? import.meta.env.VITE_OPENAI_API_KEY : process.env.OPENAI_API_KEY;
    const birdeyeKey = typeof window !== 'undefined' ? import.meta.env.VITE_BIRDEYE_API_KEY : process.env.BIRDEYE_API_KEY;
    
    const missing = [];
    if (!heliusKey) missing.push('HELIUS_API_KEY');
    if (!openaiKey) missing.push('OPENAI_API_KEY');
    if (!birdeyeKey) missing.push('BIRDEYE_API_KEY');
    
    if (missing.length > 0) {
      console.warn(`Missing required environment variables: ${missing.join(', ')}`);
      return false;
    }
    return true;
  }
};