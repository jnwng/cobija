import {
  Connection,
  Keypair,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createInitializePermanentDelegateInstruction,
  getMintLen,
  tokenMetadataInitializeWithRentTransfer,
} from "@solana/spl-token";
import env from "../data/env";

async function createTokenWithDelegate() {
  const connection = new Connection(env.SOLANA_DEVNET_URL, "confirmed");

  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(env.PAYER_SECRET_KEY))
  );
  const mintAuthority = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(env.MINT_AUTHORITY_SECRET_KEY))
  );
  const permanentDelegate = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(env.DELEGATE_SECRET_KEY))
  ); // Permanent delegate
  const mint = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(env.MINT_KEYPAIR_SECRET_KEY))
  );
  console.info({
    feePayer: payer.publicKey.toBase58(),
    permanentDelegate: permanentDelegate.publicKey.toBase58(),
    mint: mint.publicKey.toBase58(),
  });

  const tokenMetadata = {
    updateAuthority: mintAuthority.publicKey,
    mint: mint.publicKey,
    metadata: mint.publicKey,
    name: "Cobija, Bolivia",
    symbol: "CB",
    uri: "https://nftstorage.link/ipfs/bafkreida6pzrcz36hcjicqlrjikkcskyr2uy6uwuscgmkzstfvei6lpktq",
    additionalMetadata: [],
  };

  const EXTENSIONS = [
    // Used for moving tokens via the permissioned crank
    ExtensionType.PermanentDelegate,
    // Points to mint
    ExtensionType.MetadataPointer,

    // Has location-specific metadata information
    // Variable length, not included in token
    // ExtensionType.TokenMetadata,

    // Used to keep track of the dates relevant for the transfer.
    // Added to the token account.
    // ExtensionType.MemoTransfer,
  ];
  const mintLen = getMintLen(EXTENSIONS);
  console.info({ mintLen });
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  console.info({ lamports });
  const {
    value: { blockhash, lastValidBlockHeight },
  } = await connection.getLatestBlockhashAndContext();
  console.info({ blockhash });

  // Create the new token
  const transactionMessage = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializePermanentDelegateInstruction(
        mint.publicKey,
        permanentDelegate.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),

      createInitializeMetadataPointerInstruction(
        mint.publicKey,
        mintAuthority.publicKey /* update authority */,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),

      createInitializeMintInstruction(
        mint.publicKey,
        0 /* decimals */,
        mintAuthority.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      ),

      // Need to mint the token to the PDA!

      // This is activated on the token accounts themselves.
      // createInitializeAccountInstruction(),
      // createEnableRequiredMemoTransfersInstruction(
      //   mint.publicKey,
      //   payer.publicKey,
      //   [],
      //   TOKEN_2022_PROGRAM_ID
      // ),
    ],
  }).compileToV0Message();
  const transaction = new VersionedTransaction(transactionMessage);
  console.info({ accounts: transaction.message.getAccountKeys() });
  transaction.sign([payer, mint]);

  const signature = await connection.sendTransaction(transaction);
  console.info({ signature });
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  console.log(`Transaction sent with signature: ${signature}`);
  console.log(`Token created with address: ${mint.publicKey.toString()}`);

  const metadataSig = await tokenMetadataInitializeWithRentTransfer(
    connection,
    payer,
    mint.publicKey,
    mintAuthority.publicKey,
    mintAuthority,
    tokenMetadata.name,
    tokenMetadata.symbol,
    tokenMetadata.uri,
    [mintAuthority]
  );
  await connection.confirmTransaction(
    { signature: metadataSig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  console.log(`Transaction sent with signature: ${metadataSig}`);
}

createTokenWithDelegate().catch(console.error);
