import { cleanEnv, str } from "envalid";

function validateEnv() {
  return cleanEnv(process.env, {
    PAYER_SECRET_KEY: str(),
    MINT_KEYPAIR_SECRET_KEY: str(),
    MINT_AUTHORITY_SECRET_KEY: str(),
    DELEGATE_SECRET_KEY: str(),
    SOLANA_DEVNET_URL: str(),
  });
}

export default validateEnv();
