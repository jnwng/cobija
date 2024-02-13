import { Temperature } from "./parseData";
import { Keypair, PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, transferChecked } from "@solana/spl-token";
import path from "path";
import fs from "fs";
import env from "./env";

const permanentDelegateKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(env.DELEGATE_SECRET_KEY))
);
const feePayerKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(env.PAYER_SECRET_KEY))
);
const programPublicKey = new PublicKey(
  "DAtAQpWURaXExrLL11SkrEn4APims347QVczZfRVm72d"
);

export function getDerivedAddress(temperature: Temperature): PublicKey {
  const programId = programPublicKey;
  // TODO(jon): Remove this hardcoded region
  const seeds = [Buffer.from("Cobija"), Buffer.from(temperature)];
  const [derivedAddress] = PublicKey.findProgramAddressSync(seeds, programId);
  return derivedAddress;
}

export function readSolanaSecretKey(fileName: string): Keypair {
  const secretKeyString = fs.readFileSync(fileName, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

const connection = new Connection(env.SOLANA_DEVNET_URL);
export async function transferToken(
  fromAddress: PublicKey,
  toAddress: PublicKey,
  mintAddress: PublicKey
): Promise<string> {
  const signature = await transferChecked(
    connection, // Connection
    feePayerKeypair, // Signer
    fromAddress, // PublicKey (source)
    mintAddress, // PublicKey (mint)
    toAddress, // PublicKey (destination)
    permanentDelegateKeypair, // Owner as signer
    1,
    0,
    [],
    { commitment: "confirmed" },
    TOKEN_2022_PROGRAM_ID
  );
  console.info({ signature });

  const { value } = await connection.getLatestBlockhashAndContext();
  await connection.confirmTransaction({ signature, ...value }, "confirmed");

  return signature;
}
