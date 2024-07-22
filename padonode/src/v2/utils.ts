import { ethers } from "ethers";
import { readFileSync } from "node:fs";

export const getOptValue = (optValue: string | undefined, defaultValue: string | number): any => {
  if (optValue == undefined || optValue === "") {
    return defaultValue;
  }
  if (typeof defaultValue === "number") {
    return Number(optValue);
  }

  return optValue;
};

export function getPrivateKey(walletpath: string, password: string): string {
  const jsonStr = readFileSync(walletpath).toString();
  const wallet = ethers.decryptKeystoreJsonSync(jsonStr, password);
  return wallet.privateKey;
}
