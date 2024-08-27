import { Logger } from "pino";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { Metrics } from "../metrics/metrics";
import { LHEKey } from "../crypto/lhe";

export type CommonObject = {
  [propName: string]: any;
};

/**
 * @TODO 
 * Other keys, 
 * NOTE: for co-generation, should pass network info
 */
export class OtherKey {
};

/**
 * 
 */
export type KeyParams = LHEKey | OtherKey;

/**
 * @TODO 
 * The task types. Such as DataSharing, MPC, AI, etc.
 */
export enum TaskType {
  DataSharing,
  MPC,
  AI,
  /** ... */
};

/**
 * Need to correspond to specific task due to different task types
 */
export type TaskTypeConfig = {
  /** See `TaskType` */
  taskType: TaskType,
  /** See `KeyParams` */
  key?: KeyParams,
};


/**
 * Register the worker info to WorkerContract
 */
export interface RegisterParams {
  /** The name of the worker */
  name: string,
  /** The description of the worker, default is `name` */
  description: string,
  /** Register one or more task types. See `TaskTypeConfig` */
  taskTypeConfig: TaskTypeConfig[],
  /** Extra data */
  extraData?: CommonObject,
};
export interface RegisterResult {
};


/**
 * Deregister by name
 */
export interface DeregisterParams {
  /** The name of the worker */
  name: string,
  /** Extra data */
  extraData?: CommonObject,
};
export interface DeregisterResult {
};

/**
 * Update Worker description and task types by name
 */
export interface UpdateParams {
  /** The name of the worker. The name can't be updated */
  name: string,
  /** The new value of the worker description */
  description: string,
  /** The new value of taskTypes, will overwrite the original value. See `TaskTypeConfig` */
  taskTypeConfig: TaskTypeConfig[],
  /** Extra data */
  extraData?: CommonObject,
};
export interface UpdateResult {
};


export interface DoTaskParams {
  taskTypeConfig: TaskTypeConfig[],
  /** Extra data */
  extraData?: CommonObject,
};
export interface DoTaskResult {
};


/**
 * The interface.
 */
export interface IWorker {
  /**
   * Register Worker info into contract
   * @param params `RegisterParams`
   */
  register(params: RegisterParams): Promise<RegisterResult>;
  /**
   * Deregister Worker
   * @param params `DeregisterParams`
   */
  deregister(params: DeregisterParams): Promise<DeregisterResult>;
  /**
   * Update Worker info
   * @param params `UpdateParams`
   */
  update(params: UpdateParams): Promise<UpdateResult>;
  /**
   * getPendingTasks --> doTask --> reportResult
   * @param params `DoTaskParams`
   */
  doTask(params: DoTaskParams): Promise<DoTaskResult>;
};


/**
 * The supported blockchain type.
 */
export enum ChainType {
  Ethereum,
  Holesky,
  AO,
};


/**
 * 
 * 
 */
export abstract class AbstractWorker implements IWorker {
  /** `ChainType` */
  chainType: ChainType = ChainType.Ethereum;

  cfg!: WorkerConfig;
  logger!: Logger;
  nodeApi!: NodeApi;
  registry!: Registry;
  metrics!: Metrics;

  // inherited from IWorker
  abstract register(params: RegisterParams): Promise<RegisterResult>;
  abstract deregister(params: DeregisterParams): Promise<DeregisterResult>;
  abstract update(params: UpdateParams): Promise<UpdateResult>;
  abstract doTask(params: DoTaskParams): Promise<DoTaskResult>;
};
