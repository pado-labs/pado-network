/**
 * Interact with AO Contracts
 */
import { result, message, dryrun } from "@permaweb/aoconnect";
import { Logger } from "pino";
import { Collector as RpcCollector } from "../metrics/collectors/rpc-calls/rps-calls";

function getMessageResultData(Result: any/*type:MessageResult*/, showResult = false): any {
  if (showResult) {
    console.log("Result:", JSON.stringify(Result));
  }

  if (Result.Error) {
    //TODO: Recognizing different errrors
    throw Result.Error;
  }

  let Messages = Result.Messages;
  for (let Message of Messages) {
    let Tags = Message.Tags;
    for (let Tag of Tags) {
      if (Tag.name === "Error") {
        throw Tag.value;
      }
    }
  }

  for (let Message of Messages) {
    if (Message.Data) {
      return Message.Data;
    }
  }

  return undefined;
}

export class AOClient {
  constructor(
    // @ts-ignore
    private readonly DATAREGISTRY_PROCESS_ID: string,
    // @ts-ignore
    private readonly NODEREGISTRY_PROCESS_ID: string,
    // @ts-ignore
    private readonly TASKS_PROCESS_ID: string,
    // @ts-ignore
    private readonly logger: Logger,
    // @ts-ignore
    private readonly rpcCollector: RpcCollector,
  ) { }



  /////////////////////////////////////////////////////////////////////
  /// TASK-PROCESS
  /////////////////////////////////////////////////////////////////////

  /**
   * Get pending tasks
   * @returns 
   */
  async getPendingTasks(): Promise<any> {
    // const timer_beg = Date.now();
    // this.rpcCollector.addRpcRequestTotal("taskProcess.getPendingTasks", '1.0');

    let { Messages } = await dryrun({
      process: this.TASKS_PROCESS_ID,
      tags: [
        { name: "Action", value: "GetPendingTasks" },
      ],
    });
    const res = Messages[0].Data;

    // const durations = (Date.now() - timer_beg) / 1000;
    // this.rpcCollector.observeRpcRequestDurationSeconds(durations, "taskProcess.getPendingTasks", '1.0');
    return res;
  }


  /**
   * Report result to TASK-PROCESS
   * @param taskId 
   * @param nodeName 
   * @param taskResult 
   * @param signer 
   * @returns 
   */
  async reportResult(taskId: string, nodeName: string, taskResult: string, signer: any): Promise<any> {
    const msgId = await message({
      process: this.TASKS_PROCESS_ID,
      tags: [
        { name: "Action", value: "ReportResult" },
        { name: "TaskId", value: taskId },
        { name: "NodeName", value: nodeName },
      ],
      signer: signer,
      data: taskResult,
    });
    let Result = await result({
      message: msgId,
      process: this.TASKS_PROCESS_ID,
    });

    const res = getMessageResultData(Result);
    return res;
  }



  /////////////////////////////////////////////////////////////////////
  /// NODE-REGISTRY-PROCESS
  /////////////////////////////////////////////////////////////////////
  /**
   * Register or Update Node info
   * @param action 
   * @param name 
   * @param pk 
   * @param desc 
   * @param signer 
   * @returns 
   */
  async register_or_update(action: string, name: string, pk: string, desc: string, signer: any): Promise<any> {
    const msgId = await message({
      process: this.NODEREGISTRY_PROCESS_ID,
      tags: [
        { name: "Action", value: action },
        { name: "Name", value: name },
        { name: "Desc", value: desc },
      ],
      signer: signer,
      data: pk,
    });

    let Result = await result({
      message: msgId,
      process: this.NODEREGISTRY_PROCESS_ID,
    });

    const res = getMessageResultData(Result);
    return res;
  }

  async registerNode(name: string, pk: string, desc: string, signer: any): Promise<any> {
    return await this.register_or_update('Register', name, pk, desc, signer);
  }

  async updateNode(name: string, desc: string, signer: any): Promise<any> {
    return await this.register_or_update('Update', name, '', desc, signer);
  }

  /**
   * Delete node by name
   * @param name 
   * @param signer 
   * @returns 
   */
  async deleteNode(name: string, signer: any): Promise<any> {
    const msgId = await message({
      process: this.NODEREGISTRY_PROCESS_ID,
      tags: [
        { name: "Action", value: "Delete" },
        { name: "Name", value: name },
      ],
      signer: signer,
    });

    let Result = await result({
      message: msgId,
      process: this.NODEREGISTRY_PROCESS_ID,
    });

    const res = getMessageResultData(Result);
    return res;
  }

  /**
   * Get all nodes
   * @returns 
   */
  async nodes(): Promise<any> {
    let { Messages } = await dryrun({
      process: this.NODEREGISTRY_PROCESS_ID,
      tags: [
        { name: "Action", value: "Nodes" },
      ],
    });
    const nodes = Messages[0].Data;
    return nodes;
  }


  /////////////////////////////////////////////////////////////////////
  /// DATA-REGISTRY-PROCESS
  /////////////////////////////////////////////////////////////////////
  /**
   * Get data by data-id
   * @param dataId 
   * @returns 
   */
  async getDataById(dataId: string): Promise<any> {
    let { Messages } = await dryrun({
      process: this.DATAREGISTRY_PROCESS_ID,
      tags: [
        { name: "Action", value: "GetDataById" },
        { name: "DataId", value: dataId },
      ],
    });
    const res = Messages[0].Data;
    return res;
  }
};


export async function buildAOClient(
  AO_DATAREGISTRY_PROCESS_ID: string,
  AO_NODEREGISTRY_PROCESS_ID: string,
  AO_TASKS_PROCESS_ID: string,
  logger: Logger,
  rpcCollector: RpcCollector,
): Promise<AOClient> {
  const aoClient = new AOClient(
    AO_DATAREGISTRY_PROCESS_ID,
    AO_NODEREGISTRY_PROCESS_ID,
    AO_TASKS_PROCESS_ID,
    logger,
    rpcCollector,
  );

  return aoClient;
}
