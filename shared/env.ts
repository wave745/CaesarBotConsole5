// Environment variables configuration
export const ENV = {
  // API Keys
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  RUGCHECK_API_KEY: process.env.RUGCHECK_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  
  // RPC Endpoints
  JITO_RPC: process.env.JITO_RPC || 'https://mainnet.jito.bundle',
  HELIUS_RPC: process.env.HELIUS_RPC || `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`,
  
  // API Endpoints
  BIRDEYE_API: 'https://public-api.birdeye.so',
  DEXSCREENER_API: 'https://api.dexscreener.com/latest',
  RUGCHECK_API: 'https://api.rugcheck.xyz',
  JUPITER_API: 'https://quote-api.jup.ag/v6',
  
  // Network
  NETWORK: process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet',
  
  // Validation
  isConfigured: () => {
    const required = ['HELIUS_API_KEY', 'OPENAI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(`Missing required environment variables: ${missing.join(', ')}`);
      return false;
    }
    return true;
  }
};