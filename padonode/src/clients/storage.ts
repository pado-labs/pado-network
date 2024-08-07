import Arweave from "arweave";
import { getDataFromArseeding, submitDataToArseedingArConnect, submitDataToArseedingMetamask } from "./internal/arseeding";
import { getDataFromAR, submitDataToAR } from "./internal/arweave";


export const ARConfig = {
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
};

export enum StorageType {
  ARSEEDING_ETH,
  ARSEEDING_AR,
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
  switch (storageType) {
    case StorageType.ARSEEDING_ETH:
      transactionId = await submitDataToArseedingMetamask(data, 'ethereum-eth');
      break;
    case StorageType.ARSEEDING_AR:
      transactionId = await submitDataToArseedingArConnect(arweave, data, arWallet, 'ethereum-ar');
      break;
    case StorageType.ARWEAVE:
      transactionId = await submitDataToAR(arweave, data, arWallet);
      break;
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
  switch (storageType) {
    case StorageType.ARSEEDING_ETH:
    case StorageType.ARSEEDING_AR:
      data = await getDataFromArseeding(transactionId);
      break;
    case StorageType.ARWEAVE:
      data = await getDataFromAR(arweave, transactionId);
      break;
  }

  return data;
}
