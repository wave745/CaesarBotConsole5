import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair,
  TransactionInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';
import { ENV } from '@shared/env';
import { APIResponse } from '@shared/types/api';

class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(ENV.HELIUS_RPC, 'confirmed');
  }

  async getBalance(walletAddress: string): Promise<APIResponse<number>> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      
      return {
        success: true,
        data: balance / LAMPORTS_PER_SOL,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getTokenAccounts(walletAddress: string): Promise<APIResponse<any[]>> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const accounts = tokenAccounts.value.map(account => ({
        address: account.pubkey.toString(),
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
      }));

      return {
        success: true,
        data: accounts,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getRecentTransactions(walletAddress: string, limit = 50): Promise<APIResponse<any[]>> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit });
      
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await this.connection.getParsedTransaction(sig.signature);
            return {
              signature: sig.signature,
              slot: sig.slot,
              timestamp: sig.blockTime,
              fee: tx?.meta?.fee || 0,
              status: tx?.meta?.err ? 'failed' : 'success',
              instructions: tx?.transaction.message.instructions.length || 0,
            };
          } catch {
            return null;
          }
        })
      );

      return {
        success: true,
        data: transactions.filter(Boolean),
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async transferSOL(
    fromKeypair: Keypair,
    toAddress: string,
    amount: number
  ): Promise<APIResponse<{ signature: string; fee: number }>> {
    try {
      const fromPubkey = fromKeypair.publicKey;
      const toPubkey = new PublicKey(toAddress);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // Add priority fee
      const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });
      transaction.add(priorityFeeInstruction);

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair]
      );

      // Get transaction details to extract fee
      const txDetails = await this.connection.getTransaction(signature);
      const fee = txDetails?.meta?.fee || 0;

      return {
        success: true,
        data: { signature, fee },
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async transferToken(
    fromKeypair: Keypair,
    toAddress: string,
    mintAddress: string,
    amount: number,
    decimals: number
  ): Promise<APIResponse<{ signature: string; fee: number }>> {
    try {
      const fromPubkey = fromKeypair.publicKey;
      const toPubkey = new PublicKey(toAddress);
      const mint = new PublicKey(mintAddress);

      // Get or create associated token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(mint, fromPubkey);
      const toTokenAccount = await getAssociatedTokenAddress(mint, toPubkey);

      const transaction = new Transaction();

      // Check if destination token account exists
      try {
        await getAccount(this.connection, toTokenAccount);
      } catch {
        // Create associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey,
            toTokenAccount,
            toPubkey,
            mint
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromPubkey,
          amount * Math.pow(10, decimals)
        )
      );

      // Add priority fee
      const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });
      transaction.add(priorityFeeInstruction);

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair]
      );

      // Get transaction details to extract fee
      const txDetails = await this.connection.getTransaction(signature);
      const fee = txDetails?.meta?.fee || 0;

      return {
        success: true,
        data: { signature, fee },
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async multiSend(
    fromKeypair: Keypair,
    transfers: Array<{
      toAddress: string;
      amount: number;
      mintAddress?: string;
      decimals?: number;
    }>
  ): Promise<APIResponse<{ signature: string; totalFee: number }>> {
    try {
      const fromPubkey = fromKeypair.publicKey;
      const transaction = new Transaction();

      // Add priority fee
      const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });
      transaction.add(priorityFeeInstruction);

      for (const transfer of transfers) {
        const toPubkey = new PublicKey(transfer.toAddress);

        if (transfer.mintAddress) {
          // Token transfer
          const mint = new PublicKey(transfer.mintAddress);
          const fromTokenAccount = await getAssociatedTokenAddress(mint, fromPubkey);
          const toTokenAccount = await getAssociatedTokenAddress(mint, toPubkey);

          // Check if destination token account exists
          try {
            await getAccount(this.connection, toTokenAccount);
          } catch {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                fromPubkey,
                toTokenAccount,
                toPubkey,
                mint
              )
            );
          }

          transaction.add(
            createTransferInstruction(
              fromTokenAccount,
              toTokenAccount,
              fromPubkey,
              transfer.amount * Math.pow(10, transfer.decimals || 0)
            )
          );
        } else {
          // SOL transfer
          transaction.add(
            SystemProgram.transfer({
              fromPubkey,
              toPubkey,
              lamports: transfer.amount * LAMPORTS_PER_SOL,
            })
          );
        }
      }

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair]
      );

      // Get transaction details to extract fee
      const txDetails = await this.connection.getTransaction(signature);
      const totalFee = txDetails?.meta?.fee || 0;

      return {
        success: true,
        data: { signature, totalFee },
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async estimateTransactionFee(transaction: Transaction): Promise<APIResponse<number>> {
    try {
      const feeCalculator = await this.connection.getRecentBlockhash();
      const fee = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );

      return {
        success: true,
        data: fee.value || 5000, // Default fallback
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getTokenInfo(mintAddress: string): Promise<APIResponse<any>> {
    try {
      const mint = new PublicKey(mintAddress);
      const mintInfo = await this.connection.getParsedAccountInfo(mint);

      if (!mintInfo.value) {
        throw new Error('Token not found');
      }

      const data = mintInfo.value.data as any;
      
      return {
        success: true,
        data: {
          mint: mintAddress,
          decimals: data.parsed.info.decimals,
          supply: data.parsed.info.supply,
          mintAuthority: data.parsed.info.mintAuthority,
          freezeAuthority: data.parsed.info.freezeAuthority,
          isInitialized: data.parsed.info.isInitialized,
        },
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): APIResponse<never> {
    return {
      success: false,
      error: {
        message: error.message || 'Solana RPC error',
        code: error.code || 'SOLANA_ERROR',
        details: error,
      },
      timestamp: Date.now(),
    };
  }
}

export const solanaService = new SolanaService();