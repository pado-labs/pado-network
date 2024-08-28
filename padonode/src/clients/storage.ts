
import { Logger } from "pino";
import { ethers } from "ethers";
import Arweave from "arweave";
import { getDataFromArseeding, submitDataToArseedingArConnect, submitDataToArseedingMetamask } from "./internal/arseeding";
import { getDataFromAR, submitDataToAR } from "./internal/arweave";
import { Collector as RpcCollector } from "../metrics/collectors/rpc-calls/rps-calls";

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
    // @ts-ignore
    private readonly rpcCollector: RpcCollector,
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
    const timer_beg = Date.now();
    this.rpcCollector.addRpcRequestTotal("storage.submitData", '1.0');

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

    const durations = (Date.now() - timer_beg) / 1000;
    this.rpcCollector.observeRpcRequestDurationSeconds(durations, "storage.submitData", '1.0');
    return transactionId;
  }

  /**
   * Fetch data from ar and return data
   * @param arweave 
   * @param transactionId 
   * @returns 
   */
  async fetchData(transactionId: string): Promise<Uint8Array> {
    const timer_beg = Date.now();
    this.rpcCollector.addRpcRequestTotal("storage.fetchData", '1.0');

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

    const durations = (Date.now() - timer_beg) / 1000;
    this.rpcCollector.observeRpcRequestDurationSeconds(durations, "storage.fetchData", '1.0');
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
  rpcCollector: RpcCollector,
): Promise<StorageClient> {
  const storageClient = new StorageClient(
    storageType,
    ecdsaWallet,
    arWallet,
    arweave,
    noPay,
    logger,
    rpcCollector,
  );
  return storageClient;
}
