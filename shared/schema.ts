import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  tier: text("tier").notNull().default("Legionnaire"),
  caesarPoints: integer("caesar_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  contractAddress: text("contract_address").notNull().unique(),
  price: decimal("price", { precision: 18, scale: 8 }),
  marketCap: decimal("market_cap", { precision: 18, scale: 2 }),
  volume24h: decimal("volume_24h", { precision: 18, scale: 2 }),
  priceChange24h: decimal("price_change_24h", { precision: 8, scale: 4 }),
  launchpad: text("launchpad"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const snipes = pgTable("snipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  launchpad: text("launchpad").notNull(),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userWallet: text("user_wallet").notNull(),
  pubkey: text("pubkey").notNull().unique(),
  label: text("label").notNull(),
  isBurner: boolean("is_burner").notNull().default(false),
  balance: decimal("balance", { precision: 18, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  walletAddress: true,
  tier: true,
});

export const insertTokenSchema = createInsertSchema(tokens).pick({
  symbol: true,
  name: true,
  contractAddress: true,
  launchpad: true,
});

export const insertSnipeSchema = createInsertSchema(snipes).pick({
  tokenId: true,
  amount: true,
  price: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userWallet: true,
  pubkey: true,
  label: true,
  isBurner: true,
});

// Wallet operation schemas
export const walletTransferSchema = z.object({
  fromWallet: z.string().min(1, "Sender wallet required"),
  recipientAddress: z.string().min(32, "Valid recipient address required"),
  amount: z.number().min(0.000000001, "Amount must be greater than 0"),
  tokenMint: z.string().optional(),
  priorityFee: z.number().min(0).optional(),
});

export const walletMultisendSchema = z.object({
  fromWallet: z.string().min(1, "Sender wallet required"),
  recipients: z.array(z.object({
    address: z.string().min(32, "Valid address required"),
    amount: z.number().min(0.000000001, "Amount must be greater than 0"),
  })).min(1).max(50, "Maximum 50 recipients allowed"),
  tokenMint: z.string().optional(),
  priorityFee: z.number().min(0).optional(),
});

export const createWalletsSchema = z.object({
  count: z.number().min(1).max(100, "Maximum 100 wallets allowed"),
  labelPrefix: z.string().default("Wallet"),
  isBurner: z.boolean().default(true),
});

export const importWalletSchema = z.object({
  privateKey: z.string().min(1, "Private key required"),
  label: z.string().min(1, "Wallet label required"),
  isBurner: z.boolean().default(false),
});

// Type exports
export type WalletTransfer = z.infer<typeof walletTransferSchema>;
export type WalletMultisend = z.infer<typeof walletMultisendSchema>;
export type CreateWallets = z.infer<typeof createWalletsSchema>;
export type ImportWallet = z.infer<typeof importWalletSchema>;
export type WalletData = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export const insertDeploymentSchema = createInsertSchema(deployments).pick({
  tokenId: true,
  launchpad: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;
export type InsertSnipe = z.infer<typeof insertSnipeSchema>;
export type Snipe = typeof snipes.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;

// Token deployment form schema
export const tokenDeploymentSchema = z.object({
  name: z.string().min(1, "Token name is required"),
  symbol: z.string().min(1, "Token symbol is required").max(10, "Symbol must be 10 characters or less"),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  tokenType: z.enum(["meme", "tech", "utility"]).default("meme"),
  launchpad: z.enum(["pump", "bonk"]),
  devBuyAmount: z.number().min(0.01, "Dev buy must be at least 0.01 SOL").max(10, "Dev buy cannot exceed 10 SOL"),
  slippage: z.number().min(0.1).max(50).default(5),
  priorityFee: z.number().min(0).max(0.01).default(0.0001),
  logoFile: z.any().optional(),
  multiWallets: z.array(z.object({
    privateKey: z.string().optional(),
    buyAmount: z.number().min(0.001).max(1).default(0.01),
  })).optional(),
  autoPost: z.boolean().default(false),
  useDevnet: z.boolean().default(false),
});

export type TokenDeploymentForm = z.infer<typeof tokenDeploymentSchema>;
