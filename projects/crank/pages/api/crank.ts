import { PublicKey, Connection, ParsedAccountData } from "@solana/web3.js";
import { analyzeWeatherData, Temperature } from "../../data/parseData";
import { getDerivedAddress, transferToken } from "../../data/utilities";

import type { NextApiRequest, NextApiResponse } from "next";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

type ResponseData = {
  message: string;
};

const DATA_START_TIME = new Date("1973-06-19T00:00:00Z").getTime();
const DATA_END_TIME = new Date("2024-01-22T00:00:00Z").getTime();
const SIMULATION_START_TIME = new Date("2024-02-11T00:00:00Z").getTime();
const INTERVAL = 30 * 1000; // 30 seconds in milliseconds

const mintAddress = new PublicKey(
  "Cobi7gQwaTFBVHDzoQyT1J7dDaDfPcYiMstESWtifcGe"
);
const connection = new Connection(process.env.SOLANA_DEVNET_URL);
const derivedAddresses = {
  [Temperature.Cool]: getAssociatedTokenAddressSync(
    mintAddress,
    getDerivedAddress(Temperature.Cool),
    true,
    TOKEN_2022_PROGRAM_ID
  ),
  // 9d3QmjPBkmMpgRfLYt2cjzZMFYSXz2ZDsj9xGD5ByPmh / BCf48wnu7e5k86iX2QHXdhgbNkdCCTbPN8v9QZWAXBSD
  [Temperature.Medium]: getAssociatedTokenAddressSync(
    mintAddress,
    getDerivedAddress(Temperature.Medium),
    true,
    TOKEN_2022_PROGRAM_ID
  ),
  // 5NUhqNsZxzxjXb82ZS4u2GxswSoWg3vCdRjXVTGAix8i /VBhWSHCkwuTdLxr9MbJSay8iCyyBj54sQYDG3sTrGkn
  [Temperature.Hot]: getAssociatedTokenAddressSync(
    mintAddress,
    getDerivedAddress(Temperature.Hot),
    true,
    TOKEN_2022_PROGRAM_ID
  ),
  // 7r8B6mJ1VhcpNwDH4HfseHjK71ktrHQENmCHkM7nLm1F / 7Dr36x1PDNjxPm4U8RgmgX1nXvrFFssL5iktzpadqUc6
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const currentTime = new Date().getTime();
  const elapsedIntervals = Math.floor(
    (currentTime - SIMULATION_START_TIME) / INTERVAL
  );

  const temperatureResults = await analyzeWeatherData();
  const nextTemperature = temperatureResults[elapsedIntervals]; // Assuming the first row corresponds to 1973 and so on
  console.info({ elapsedIntervals, nextTemperature });

  const targetAddress = derivedAddresses[nextTemperature.temp];
  const targetTokenInfo = await connection.getParsedAccountInfo(targetAddress);
  console.info({ targetTokenInfo });

  if (
    (targetTokenInfo.value?.data as ParsedAccountData)?.parsed.info.tokenAmount
      .uiAmount === 1
  ) {
    console.log(
      `Token is already with the correct owner for temperature ${nextTemperature.temp}`
    );
  } else {
    for (const [temperature, address] of Object.entries(derivedAddresses)) {
      if (address.toString() === targetAddress.toString()) continue; // Skip the target address since it's already checked

      const tokenInfo = await connection.getParsedAccountInfo(address);
      console.info({ tokenInfo, temperature });

      if (
        (tokenInfo.value?.data as ParsedAccountData).parsed.info.tokenAmount
          .uiAmount === 1
      ) {
        // TODO(jon): Have this handle cleaning up old ATAs while sending
        console.info(
          `Token needs to be transferred from ${address} to ${targetAddress} for temperature ${nextTemperature.temp}`
        );
        const transferSig = await transferToken(
          address,
          targetAddress,
          mintAddress
        );
        console.info({ transferSig });
        break;
      }
    }
  }

  res.status(200).json({ message: "Hello from Next.js!" });
}
