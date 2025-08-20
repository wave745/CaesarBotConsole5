# Caesarbot Console

## Overview

Caesarbot Console is a comprehensive Web3 trading platform specifically designed for Solana ecosystem participants. The application serves as a unified dashboard for token snipers, deployers, and traders who want to interact with various Solana launchpads and DeFi protocols. The platform combines real-time market scanning, automated trading capabilities, token deployment tools, and gamified reward systems into a single, cohesive interface.

The application targets advanced cryptocurrency traders and developers who need sophisticated tools for discovering, analyzing, and trading new token launches across multiple Solana-based platforms like Pump.fun, LetsBonk.fun, and others. It emphasizes speed, automation, and data-driven decision making in the fast-paced world of meme token trading.

## User Preferences

Preferred communication style: Simple, everyday language.

## Current System Status (August 2025)

The application is currently running and functional with the following state:
- Backend Express server running on port 5000
- Frontend Vite development server integrated
- Mock data mode activated (real API integrations temporarily disabled)
- In-memory storage using MemStorage class
- Database schema defined but using temporary storage
- All core UI components and pages implemented
- Wallet creation and management functionality working

## System Architecture

### Frontend Architecture
The client application is built using **React 18** with **TypeScript** for type safety and modern development practices. The UI framework leverages **shadcn/ui** components built on top of **Radix UI primitives**, providing a consistent and accessible design system. **Tailwind CSS** handles styling with a custom dark theme featuring deep blacks and gold accents that align with the Caesar branding.

State management is handled through **Zustand** for global application state, including user data, trading preferences, and UI state like sidebar visibility. **TanStack React Query** manages server state, caching, and API interactions for optimal performance and user experience.

The routing system uses **Wouter** as a lightweight alternative to React Router, providing client-side navigation between different modules like Dashboard, Deploy, Sniper, Scanner, and Rewards sections.

### Backend Architecture
The backend is built on **Express.js** with **TypeScript**, providing a RESTful API architecture. The server implements middleware for request logging, JSON parsing, and error handling. The API follows conventional REST patterns with endpoints organized by feature domains (scanner, rewards, trading, etc.).

**Vite** is integrated for development with hot module replacement and optimized builds for production deployment. The build process uses **esbuild** to bundle the server code for efficient production deployment.

### Data Storage Solutions
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations and schema management. **Neon Database** serves as the cloud PostgreSQL provider, offering serverless scaling capabilities.

The database schema includes core entities like users, tokens, snipes, deployments, and wallets with proper foreign key relationships. **Drizzle Kit** handles database migrations and schema evolution.

Session management is implemented using **connect-pg-simple** for PostgreSQL-backed session storage, ensuring user authentication state persists across requests.

### External Dependencies
The platform integrates with multiple **Solana blockchain APIs** for real-time token data, price feeds, and transaction monitoring. Various **launchpad APIs** (Pump.fun, LetsBonk.fun, etc.) provide token discovery and deployment capabilities.

**Web3 wallet integration** supports popular Solana wallets for transaction signing and balance management. The application requires connection to Solana RPC endpoints for blockchain interactions and real-time data feeds.

Real-time market data comes from **DEX aggregators** and **price oracles** to provide accurate trading information and Caesar rating calculations for risk assessment.

Font resources are loaded from **Google Fonts** (Inter, JetBrains Mono) to maintain consistent typography across the application.

The development environment includes **Replit-specific plugins** for enhanced development experience and debugging capabilities when running in the Replit environment.

## Project Structure

### Core Files and Components

**Configuration & Setup:**
- `vite.config.ts` - Build configuration with path aliases (@, @shared, @assets)
- `tailwind.config.ts` - Styling configuration with custom Caesar theme colors
- `drizzle.config.ts` - Database ORM configuration
- `package.json` - Dependencies including Solana, React Query, Zustand

**Backend Structure:**
- `server/index.ts` - Express server entry point
- `server/routes.ts` - API route definitions with external service integrations
- `server/storage.ts` - Data storage interface and in-memory implementation
- `server/services/api.ts` - External API service classes (Helius, Birdeye, Jupiter, OpenAI, Supabase)
- `shared/schema.ts` - Database schema and validation schemas using Drizzle + Zod

**Frontend Structure:**
- `client/src/main.tsx` - React application entry point
- `client/src/App.tsx` - Root component with routing and providers
- `client/src/components/Layout.tsx` - Main layout with sidebar and header
- `client/src/store/useAppStore.ts` - Global state management with Zustand
- `client/src/lib/api/` - Client-side API service modules
- `client/src/lib/queryClient.ts` - React Query configuration
- `client/src/pages/` - Main application pages (Dashboard, Sniper, WalletOps, etc.)

### Key Features Implemented

**1. Dashboard Page** (`client/src/pages/Dashboard.tsx`)
- Portfolio overview with real-time stats
- Market data display with trending tokens
- AI trading controls and sniper integration
- Recent activity and trade execution interface

**2. Caesar Sniper** (`client/src/pages/Sniper.tsx`)
- Automated token sniping configuration
- Bundle bot for multi-wallet operations  
- Manual snipe functionality
- Token filtering and launchpad selection

**3. Wallet Operations** (`client/src/pages/WalletOps.tsx`)
- Multi-wallet management system
- Bulk wallet creation and import
- Token transfers and multi-send functionality
- Balance tracking and private key management

**4. Scanner, Deploy, Rewards Pages**
- Token scanning with advanced filters
- Token deployment to launchpads
- Gamified reward system with missions

### API Integration Points

**External Services Integrated:**
- **Helius API** - Solana RPC, balance queries, transaction history
- **Birdeye API** - Token prices, trending tokens, OHLCV data
- **Jupiter API** - DEX aggregation and trading quotes
- **OpenAI API** - AI-powered trading analysis
- **Supabase** - User stats and authentication
- **Pump.fun & other launchpads** - Token deployment and monitoring

**Storage System:**
- Currently using in-memory storage (`MemStorage`)
- Database schema defined for PostgreSQL with tables: users, tokens, snipes, deployments, wallets
- Migration system ready via Drizzle Kit

## Technical Decisions

**State Management:**
- Zustand for client-side global state (UI, user data, trading state)
- React Query for server state management and API caching
- Persistent storage for user preferences and session data

**Styling & UI:**
- Dark theme with Caesar branding (blacks, golds, purples)
- Responsive design with mobile-first approach
- Custom CSS variables for consistent theming
- Shadcn/ui components for consistent UI patterns

**Development Workflow:**
- Single npm run dev command starts both frontend and backend
- Hot reloading for development efficiency
- TypeScript throughout for type safety
- Modular architecture for easy feature additions

## Recent Changes

- August 2025: Complete codebase audit and documentation
- Identified current mock data state and real API integration points
- Confirmed all core features are implemented and functional
- Documented system architecture and component relationships