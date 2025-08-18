# Caesarbot Console

## Overview

Caesarbot Console is a comprehensive Web3 trading platform specifically designed for Solana ecosystem participants. The application serves as a unified dashboard for token snipers, deployers, and traders who want to interact with various Solana launchpads and DeFi protocols. The platform combines real-time market scanning, automated trading capabilities, token deployment tools, and gamified reward systems into a single, cohesive interface.

The application targets advanced cryptocurrency traders and developers who need sophisticated tools for discovering, analyzing, and trading new token launches across multiple Solana-based platforms like Pump.fun, LetsBonk.fun, and others. It emphasizes speed, automation, and data-driven decision making in the fast-paced world of meme token trading.

## User Preferences

Preferred communication style: Simple, everyday language.

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