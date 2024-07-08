"use strict";
// https://station.jup.ag/docs/apis/swap-api
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor_1 = require("@project-serum/anchor");
const helpers_1 = require("@solana-developers/helpers");
const web3_js_1 = require("@solana/web3.js");
require("dotenv/config");
let inputMint = "So11111111111111111111111111111111111111112"; // SOL as example but any other mint will work as well
let outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
let amount = 100000000; // Lamports
let slippageBps = 50; // 0.5%
let feeAccountAddress = "42zCqyYC2yY5oDDgF4ztfsWGsvEg6GvHfLojJtKRz44y"; // Address of the fee account
const jupiterSwap = (inputMint, outputMint, amount, slippageBps, feeAccountAddress) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // You can use Solan default rpc, but custom provider is recommended like shyft, or helius or others
        const connection = new web3_js_1.Connection("https://api.mainnet-beta.solana.com");
        // You need to create a new .env file, use info from .env-copy.txt files
        const keypair = (0, helpers_1.getKeypairFromEnvironment)("SECRET_KEY");
        const wallet = new anchor_1.Wallet(keypair);
        // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
        const quoteResponse = yield (yield fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}\
&outputMint=${outputMint}\
&amount=${amount}\
&slippageBps=${slippageBps}`)).json();
        // console.log({ quoteResponse });
        // get serialized transactions for the swap
        const swapApiResponse = yield (yield fetch("https://quote-api.jup.ag/v6/swap", {
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
        })).json();
        console.log("Swap API Response:", swapApiResponse);
        const swapTransaction = swapApiResponse.swapTransaction;
        if (!swapTransaction)
            throw new Error("Swap transaction not found");
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        let transaction = web3_js_1.VersionedTransaction.deserialize(swapTransactionBuf);
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
    }
    catch (error) {
        console.log(error);
    }
});
jupiterSwap(inputMint, outputMint, amount, slippageBps, feeAccountAddress);
