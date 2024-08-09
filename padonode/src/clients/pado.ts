/**
 * Interact with PADO Contracts
 */
import { Logger } from "pino";
import { ethers } from "ethers";
import { feeMgtABI } from "../abis/feeMgtABI";
import { dataMgtABI } from "../abis/dataMgtABI";
import { taskMgtABI } from "../abis/taskMgtABI";
import { workerMgtABI } from "../abis/workerMgtABI";

interface EncryptionSchema {
  t: number;
  n: number;
};
interface PriceInfo {
  tokenSymbol: string;
  price: number;
};


export class PadoClient {
  constructor(
    // @ts-ignore
    private readonly ecdsaWallet: ethers.Wallet,
    // @ts-ignore
    private readonly feeMgt: ethers.Contract,
    // @ts-ignore
    private readonly dataMgt: ethers.Contract,
    // @ts-ignore
    private readonly taskMgt: ethers.Contract,
    // @ts-ignore
    private readonly workerMgt: ethers.Contract,
    // @ts-ignore
    private readonly logger: Logger,
  ) {
  }

  /////////////////////////////////////////////////////////////////////
  /// FEE
  /////////////////////////////////////////////////////////////////////
  async getFeeTokenBySymbol(
    tokenSymbol: string,
  ): Promise<any | null> { // FeeTokenInfo
    const res = await this.feeMgt.getFeeTokenBySymbol(tokenSymbol);
    // console.log('getFeeTokenBySymbol res', res);
    return res;
  }

  /////////////////////////////////////////////////////////////////////
  /// DATA
  /////////////////////////////////////////////////////////////////////
  async prepareRegistry(encryptionSchema: EncryptionSchema): Promise<any | null> {
    const tx = await this.dataMgt.prepareRegistry(encryptionSchema);
    const receipt = await tx.wait();
    this.logger.debug(`prepareRegistry gasUsed: ${receipt.gasUsed}`);
    this.logger.info(`prepareRegistry transactionHash: ${receipt.transactionHash}`);
    const events = receipt.events;
    for (const event of events) {
      if (event.event === "DataPrepareRegistry") {
        return event.args;
      }
    }

    return null;
  }

  async registerData(
    dataId: string,
    dataTag: string,
    priceInfo: PriceInfo,
    dataContent: string,
  ): Promise<string | null> {
    let tx = await this.dataMgt.register(
      dataId,
      dataTag,
      priceInfo,
      dataContent,
    );
    const receipt = await tx.wait();
    this.logger.debug(`registerData gasUsed: ${receipt.gasUsed}`);
    this.logger.info(`registerData transactionHash: ${receipt.transactionHash}`);
    const events = receipt.events;
    for (const event of events) {
      if (event.event === "DataRegistered") {
        return event.args;
      }
    }
    return null;
  }


  async getDataById(
    dataId: string,
  ): Promise<any | null> { // DataInfo
    const res = await this.dataMgt.getDataById(dataId);
    // console.log('getDataById res', res);
    return res;
  }

  /////////////////////////////////////////////////////////////////////
  /// TASK
  /////////////////////////////////////////////////////////////////////
  async submitTask(
    taskType: number,
    consumerPk: string,
    dataId: string,
    feeAmount: number,
  ): Promise<any | null> {
    const submitTaskIdentifier = 'submitTask(uint8,bytes,bytes32)';
    let tx = await this.taskMgt[submitTaskIdentifier](taskType, consumerPk, dataId, { value: feeAmount });
    const receipt = await tx.wait();
    this.logger.debug(`submitTask gasUsed: ${receipt.gasUsed}`);
    this.logger.info(`submitTask transactionHash: ${receipt.transactionHash}`);
    const events = receipt.events;
    for (const event of events) {
      if (event.event === "TaskDispatched") {
        return event.args;
      }
    }

    return null;
  }

  async getPendingTasks(): Promise<any | null> {
    let res = await this.taskMgt.getPendingTasks();
    // console.log('getPendingTasks res', res);
    return res;
  }

  /**
   * 
   * @param workerId 
   * @returns Task[]
   */
  async getPendingTasksByWorkerId(workerId: string): Promise<any | null> {
    let res = await this.taskMgt.getPendingTasksByWorkerId(workerId);
    return res;
  }

  async getCompletedTaskById(taskId: string): Promise<any | null> {
    let res = await this.taskMgt.getCompletedTaskById(taskId);
    // console.log('getCompletedTaskById res', res);
    return res;
  }


  async reportResult(taskId: string, workerId: string, result: string, gasLimit: string): Promise<any | null> {
    try {
      const tx = await this.taskMgt.reportResult(taskId, workerId, result, { gasLimit: gasLimit });
      const receipt = await tx.wait();
      this.logger.debug(`reportResult gasUsed: ${receipt.gasUsed}`);
      this.logger.info(`reportResult transactionHash: ${receipt.transactionHash}`);
      const events = receipt.events;
      for (const event of events) {
        if (event.event === "ResultReported") {
          return event.args;
        }
      }
    } catch (error: any) {
      console.log("reportResult error:\n", error, '\ntry callStatic');
      if (error) {
        if (error.error) {
          if (error.error.message) {
            console.error(`reportResult error: ${error.error.message}`);
          }
        }
      }
      try {
        const tx = await this.taskMgt.callStatic.reportResult(taskId, workerId, result);
        console.log("reportResult.callStatic tx:\n", tx);
      } catch (error) {
        console.log("reportResult.callStatic error:\n", error);
      }
    }
    return null;
  }


  /////////////////////////////////////////////////////////////////////
  /// WORKER
  /////////////////////////////////////////////////////////////////////
  async addWhiteListItem(addr: string): Promise<any | null> {
    let res = await this.workerMgt.addWhiteListItem(addr);
    console.log('addWhiteListItem res', res);
    return res;
  }

};


export async function buildPadoClient(
  ecdsaWallet: ethers.Wallet,
  dataMgtAddress: string,
  taskMgtAddress: string,
  workerMgtAddress: string,
  logger: Logger,
): Promise<PadoClient> {
  const dataMgt = new ethers.Contract(dataMgtAddress, dataMgtABI, ecdsaWallet);
  const taskMgt = new ethers.Contract(taskMgtAddress, taskMgtABI, ecdsaWallet);
  const workerMgt = new ethers.Contract(workerMgtAddress, workerMgtABI, ecdsaWallet);

  const feeMgtAddress: string = await taskMgt.feeMgt();
  const feeMgt = new ethers.Contract(feeMgtAddress, feeMgtABI, ecdsaWallet);

  const padoClient = new PadoClient(
    ecdsaWallet,
    feeMgt,
    dataMgt,
    taskMgt,
    workerMgt,
    logger,
  );

  return padoClient;
}

