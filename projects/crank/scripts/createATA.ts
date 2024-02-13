import { Connection, PublicKey, Keypair, Signer } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import env from "../data/env";

async function createATAAndMintToIt(
  connection: Connection,
  payer: Signer,
  mint: PublicKey,
  destinationWallet: PublicKey,
  amount: number,
  mintAuthority: Signer
) {
  // Get or create the ATA for the destination wallet
  // const ata = await getOrCreateAssociatedTokenAccount(
  //   connection,
  //   payer, // payer of the transaction fees
  //   mint, // mint address of the token
  //   destinationWallet, // wallet to create the ATA for
  //   undefined,
  //   undefined,
  //   undefined,
  //   TOKEN_2022_PROGRAM_ID
  // );
  // const ata = new PublicKey("DLztTpYYS4zAsU3cS6iaXPesdyX9yseC3EAiRw138iYR");

  // Mint tokens to the ATA
  // const signature = await mintTo(
  //   connection,
  //   payer, // payer of the transaction fees
  //   mint, // mint address of the token
  //   ata, // address of the ATA
  //   mintAuthority, // authority of the mint
  //   amount, // amount to mint
  //   [],
  //   undefined,
  //   TOKEN_2022_PROGRAM_ID
  // );
  // console.info({ signature });

  // Pre-create the ATAs, but normally we would just open / close them as the NFT moves
  const mintAddress = new PublicKey(
    "Cobi7gQwaTFBVHDzoQyT1J7dDaDfPcYiMstESWtifcGe"
  );
  const derivedAddresses = [
    "9d3QmjPBkmMpgRfLYt2cjzZMFYSXz2ZDsj9xGD5ByPmh",
    "5NUhqNsZxzxjXb82ZS4u2GxswSoWg3vCdRjXVTGAix8i",
    "7r8B6mJ1VhcpNwDH4HfseHjK71ktrHQENmCHkM7nLm1F",
  ];

  for (const address of derivedAddresses) {
    const destinationWallet = new PublicKey(address);
    const account = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintAddress,
      destinationWallet,
      /* allowOwnerOffCurve */ true,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.info({ account });
  }
}

const connection = new Connection(env.SOLANA_DEVNET_URL);
const mint = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(env.MINT_KEYPAIR_SECRET_KEY))
).publicKey;
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(env.PAYER_SECRET_KEY))
);
const mintAuthority = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(env.MINT_AUTHORITY_SECRET_KEY))
);

createATAAndMintToIt(
  connection,
  payer,
  mint,
  mintAuthority.publicKey,
  1,
  mintAuthority
);
