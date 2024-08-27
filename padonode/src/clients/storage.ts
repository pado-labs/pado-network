
import { Logger } from "pino";
import { ethers } from "ethers";
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

export class StorageClient {
  constructor(
    // @ts-ignore
    private readonly storageType: StorageType,
    // @ts-ignore
    private readonly ecdsaWallet: ethers.Wallet,
    // @ts-ignore
    private readonly arWallet: any,
    // @ts-ignore
    private readonly arweave: Arweave,
    // @ts-ignore
    private readonly noPay: boolean,
    // @ts-ignore
    private readonly logger: Logger,
  ) {
  }

  /**
   * submit data to ar and return transaction id
   * @param arweave 
   * @param data 
   * @param arWallet 
   * @returns 
   */
  async submitData(data: Uint8Array): Promise<string> {
    let transactionId;
    switch (this.storageType) {
      case StorageType.ARSEEDING_ETH:
        transactionId = await submitDataToArseedingMetamask(data, this.ecdsaWallet.privateKey, 'ethereum-eth', this.noPay);
        break;
      case StorageType.ARSEEDING_AR:
        transactionId = await submitDataToArseedingArConnect(this.arweave, data, this.arWallet, 'ethereum-ar', this.noPay);
        break;
      case StorageType.ARWEAVE:
        transactionId = await submitDataToAR(this.arweave, data, this.arWallet);
        break;
    }
    return transactionId;
  }

  /**
   * Fetch data from ar and return data
   * @param arweave 
   * @param transactionId 
   * @returns 
   */
  async fetchData(transactionId: string): Promise<Uint8Array> {
    let data;
    switch (this.storageType) {
      case StorageType.ARSEEDING_ETH:
      case StorageType.ARSEEDING_AR:
        data = await getDataFromArseeding(transactionId);
        break;
      case StorageType.ARWEAVE:
        data = await getDataFromAR(this.arweave, transactionId);
        break;
    }

    return data;
  }
}

export async function buildStorageClient(
  storageType: StorageType,
  ecdsaWallet: ethers.Wallet,
  arWallet: any,
  arweave: Arweave,
  noPay: boolean,
  logger: Logger,
): Promise<StorageClient> {
  const storageClient = new StorageClient(
    storageType,
    ecdsaWallet,
    arWallet,
    arweave,
    noPay,
    logger,
  );
  return storageClient;
}
