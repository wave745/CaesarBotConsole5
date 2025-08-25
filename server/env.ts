// Server-side environment variables
export const SERVER_ENV = {
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};