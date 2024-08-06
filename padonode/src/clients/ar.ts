import Arweave from "arweave";
import { getDataFromArseeding, submitDataToArseeding } from "./internal/arseeding";
import { getDataFromAR, submitDataToAR } from "./internal/arweave";


export const ARConfig = {
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
};

export enum StorageType {
  ARSEEDING,
  ARWEAVE,
};

/**
 * submit data to ar and return transaction id
 * @param storageType 
 * @param arweave 
 * @param data 
 * @param arWallet 
 * @returns 
 */
export async function submitData(storageType: StorageType, arweave: Arweave, data: Uint8Array, arWallet: any): Promise<string> {
  let transactionId;
  if (storageType === StorageType.ARSEEDING) {
    transactionId = await submitDataToArseeding(arweave, data, arWallet, undefined);
  } else {
    transactionId = await submitDataToAR(arweave, data, arWallet);
  }
  return transactionId;
}

/**
 * Fetch data from ar and return data
 * @param storageType 
 * @param arweave 
 * @param transactionId 
 * @returns 
 */
export async function fetchData(storageType: StorageType, arweave: Arweave, transactionId: string): Promise<Uint8Array> {
  let data;
  if (storageType === StorageType.ARSEEDING) {
    data = await getDataFromArseeding(transactionId);
  } else {
    data = await getDataFromAR(arweave, transactionId);
  }
  return data;
}
