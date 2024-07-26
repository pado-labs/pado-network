import { readFileSync } from "node:fs";
import { eth as Web3Eth } from "web3";

export function getOptValue(optValue: string | undefined, defaultValue: string | number): any {
  if (optValue == undefined || optValue === "") {
    return defaultValue;
  }
  if (typeof defaultValue === "number") {
    return Number(optValue);
  }

  return optValue;
};


export async function getPrivateKey(walletpath: string, password: string): Promise<string> {
  const jsonStr = readFileSync(walletpath).toString();
  const keystoreJson = JSON.parse(jsonStr);
  if (!keystoreJson.address) {
    keystoreJson.id = "00000000-0000-0000-0000-000000000000";
    keystoreJson.address = "0x0000000000000000000000000000000000000000";
    keystoreJson.version = 3;
  }

  const account = await Web3Eth.accounts.decrypt(keystoreJson, password);
  return account.privateKey;
}

export function bitmapToQuorumIds(bitmap: bigint): number[] {
  bitmap = BigInt(bitmap)
  const quorumIds: number[] = [];
  for (let i = 0n; i < 192n; i++) {
    if (bitmap & (1n << i)) {
      quorumIds.push(Number(i));
    }
  }
  return quorumIds;
}
