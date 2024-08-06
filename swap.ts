// https://station.jup.ag/docs/apis/swap-api

import { Wallet } from "@project-serum/anchor";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import "dotenv/config";

let inputMint = "So11111111111111111111111111111111111111112"; // SOL as example but any other mint will work as well
let outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
let amount = 100000000; // Lamports
let slippageBps = 100; // 1%
let feeAccountAddress = "7785dZSPa7nXCdigZNpYEkYPniuoGKE9BRSpSMWXr42P"; // Address of the fee account

const jupiterSwap = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number,
  feeAccountAddress?: string
) => {
  try {
    // You can use Solan default rpc, but custom provider is recommended like shyft, or helius or others

    const connection = new Connection("https://api.mainnet-beta.solana.com");

    // You need to create a new .env file, use info from .env-copy.txt files
    const keypair = getKeypairFromEnvironment("SECRET_KEY");

    const wallet = new Wallet(keypair);

    // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
    const quoteResponse = await (
      await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}\
&outputMint=${outputMint}\
&amount=${amount}\
&slippageBps=${slippageBps}`
      )
    ).json();

    // console.log({ quoteResponse });

    // get serialized transactions for the swap
    const swapApiResponse = await (
      await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          feeAccount: feeAccountAddress,
        }),
      })
    ).json();

    console.log("Swap API Response:", swapApiResponse);

    const swapTransaction = swapApiResponse.swapTransaction;

    if (!swapTransaction) throw new Error("Swap transaction not found");

    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    let transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log("Deserialized Transaction:", transaction);

    transaction.sign([wallet.payer]);

    // console.log(transaction);

    // Execute the transaction
    // const rawTransaction = transaction.serialize();
    // const txid = await connection.sendRawTransaction(rawTransaction, {
    //   skipPreflight: true,
    //   maxRetries: 10,
    // });
    // await connection.confirmTransaction(txid);
    // console.log(`https://solscan.io/tx/${txid}`);
  } catch (error) {
    console.log(error);
  }
};

jupiterSwap(inputMint, outputMint, amount, slippageBps, feeAccountAddress);
