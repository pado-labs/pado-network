import { readFileSync } from "node:fs";
import { eth as Web3Eth } from "web3";

export function getOptValue(optValue: string | undefined, defaultValue: string | number | boolean): any {
  if (optValue == undefined || optValue === "") {
    return defaultValue;
  }
  if (typeof defaultValue === "number") {
    return Number(optValue);
  } else if (typeof defaultValue === "boolean") {
    return optValue === "true";
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


export function Uint8ArrayToString(data: Uint8Array) {
  var dataString = "";
  for (var i = 0; i < data.length; i++) {
    dataString += String.fromCharCode(data[i]);
  }

  return dataString
}


export function stringToUint8Array(str: string) {
  var arr = [];
  for (var i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }

  var data = new Uint8Array(arr);
  return data
}