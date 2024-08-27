/**
 * Interact with PADO Contracts
 */
import { Logger } from "pino";
import { ethers } from "ethers";
import { feeMgtABI } from "../abis/feeMgtABI";
import { dataMgtABI } from "../abis/dataMgtABI";
import { taskMgtABI } from "../abis/taskMgtABI";
import { workerMgtABI } from "../abis/workerMgtABI";
import { routerABI } from "../abis/routerABI";

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
  /**
   * 
   * @param tokenSymbol 
   * @returns FeeTokenInfo
   */
  async getFeeTokenBySymbol(
    tokenSymbol: string,
  ): Promise<any | null> {
    const res = await this.feeMgt.getFeeTokenBySymbol(tokenSymbol);
    return res;
  }
  async getBalance(
    eoa: string,
    tokenSymbol: string,
  ): Promise<any | null> {
    const res = await this.feeMgt.getBalance(eoa, tokenSymbol);
    return res;
  }
  async withdrawToken(to: string, tokenSymbol: string, amount: number): Promise<any | null> {
    try {
      const tx = await this.feeMgt.withdrawToken(to, tokenSymbol, amount);
      const receipt = await tx.wait();
      this.logger.info({
        transactionHash: receipt.transactionHash,
        gasUsed: Number(receipt.gasUsed),
      }, 'fee.withdrawToken');
      const events = receipt.events;
      for (const event of events) {
        if (event.event === "TokenWithdrawn") {
          return event.args;
        }
      }
    } catch (error) {
      console.log('fee.withdrawToken error', error);
      const tx = await this.feeMgt.callStatic.withdrawToken(to, tokenSymbol, amount);
      console.log('fee.withdrawToken.callStatic tx', tx);
      throw error;
    }

    return null;
  }

  /////////////////////////////////////////////////////////////////////
  /// DATA
  /////////////////////////////////////////////////////////////////////
  async prepareRegistry(encryptionSchema: EncryptionSchema): Promise<any | null> {
    try {
      const tx = await this.dataMgt.prepareRegistry(encryptionSchema);
      const receipt = await tx.wait();
      this.logger.info({
        transactionHash: receipt.transactionHash,
        gasUsed: Number(receipt.gasUsed),
      }, 'data.prepareRegistry');
      const events = receipt.events;
      for (const event of events) {
        if (event.event === "DataPrepareRegistry") {
          return event.args;
        }
      }
    } catch (error) {
      console.log('prepareRegistry error', error);
      const tx = await this.dataMgt.callStatic.prepareRegistry(encryptionSchema);
      console.log('prepareRegistry.callStatic tx', tx);
      throw error;
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
    this.logger.info({
      transactionHash: receipt.transactionHash,
      gasUsed: Number(receipt.gasUsed),
    }, 'data.register');
    const events = receipt.events;
    for (const event of events) {
      if (event.event === "DataRegistered") {
        return event.args;
      }
    }
    return null;
  }

  /**
   * 
   * @param dataId 
   * @returns DataInfo
   */
  async getDataById(
    dataId: string,
  ): Promise<any | null> {
    const res = await this.dataMgt.getDataById(dataId);
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
    this.logger.info({
      transactionHash: receipt.transactionHash,
      gasUsed: Number(receipt.gasUsed),
    }, 'task.submitTask');
    const events = receipt.events;
    for (const event of events) {
      if (event.event === "TaskDispatched") {
        return event.args;
      }
    }

    return null;
  }

  /**
   * 
   * @returns Task[]
   */
  async getPendingTasks(): Promise<any | null> {
    let res = await this.taskMgt.getPendingTasks();
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

  /**
   * 
   * @param taskId 
   * @returns Task[]
   */
  async getCompletedTaskById(taskId: string): Promise<any | null> {
    let res = await this.taskMgt.getCompletedTaskById(taskId);
    return res;
  }


  async reportResult(taskId: string, workerId: string, result: string, gasLimit: string): Promise<any | null> {
    try {
      const tx = await this.taskMgt.reportResult(taskId, workerId, result, { gasLimit: gasLimit });
      const receipt = await tx.wait();
      this.logger.info({
        transactionHash: receipt.transactionHash,
        gasUsed: Number(receipt.gasUsed),
      }, 'task.reportResult');
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
        throw error;
      }
      throw error;
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

//@ts-ignore
export async function buildPadoClient(
  ecdsaWallet: ethers.Wallet,
  routerAddress: string,
  logger: Logger,
): Promise<PadoClient> {
  const router = new ethers.Contract(routerAddress, routerABI, ecdsaWallet);
  const feeMgtAddress: string = await router.getFeeMgt();
  const dataMgtAddress: string = await router.getDataMgt();
  const taskMgtAddress: string = await router.getTaskMgt();
  const workerMgtAddress: string = await router.getWorkerMgt();
  // console.log('buildPadoClient    feeMgtAddress', feeMgtAddress);
  // console.log('buildPadoClient   dataMgtAddress', dataMgtAddress);
  // console.log('buildPadoClient   taskMgtAddress', taskMgtAddress);
  // console.log('buildPadoClient workerMgtAddress', workerMgtAddress);

  const feeMgt = new ethers.Contract(feeMgtAddress, feeMgtABI, ecdsaWallet);
  const dataMgt = new ethers.Contract(dataMgtAddress, dataMgtABI, ecdsaWallet);
  const taskMgt = new ethers.Contract(taskMgtAddress, taskMgtABI, ecdsaWallet);
  const workerMgt = new ethers.Contract(workerMgtAddress, workerMgtABI, ecdsaWallet);

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

