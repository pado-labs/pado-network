import { getOptValue } from '../utils';
import * as dotenv from "dotenv";
dotenv.config();

export class EnvConfig {
  // Globals
  nodeName: string;
  nodeDescription: string;

  // EigenLayer
  ethRpcUrl: string;
  ecdsaKeyFile: string;
  ecdsaKeyPass: string;
  blsKeyFile: string;
  blsKeyPass: string;
  registryCoordinatorAddress: string;
  operatorStateRetrieverAddress: string;
  earningsReceiver: string;
  delegationApprover: string;
  metadataURI: string;

  operatorSignatureExpirySeconds: number;
  operatorSocketIpPort: string;

  nodeEnableNodeApi: boolean;
  nodeNodeApiPort: number;
  nodeEnableMetrics: boolean;
  nodeMetricsPort: number;

  // PADO
  dataMgtAddress: string;
  taskMgtAddress: string;
  workerMgtAddress: string;
  routerAddress: string;

  // AO
  lheKeyPath: string;
  arWalletPath: string;
  aoDataRegistryProcessId: string;
  aoNodeRegistryProcessId: string;
  aoTasksProcessId: string;

  // ARWEAVE API CONFIG
  arweaveApiHost: string;
  arweaveApiPort: number;
  arweaveApiProtocol: string;

  // storage type: ARSEEDING_ETH, ARSEEDING_AR, ARWEAVE
  dataStorageTypeEL: string;
  dataStorageTypeAO: string;

  // Enables
  enableEigenLayer: boolean;
  enableAO: boolean;


  constructor() {
    // Globals
    this.nodeName = getOptValue(process.env.NODE_NAME, "EmptyName");
    this.nodeDescription = getOptValue(process.env.NODE_DESCRIPTION, "");

    // EigenLayer
    this.ethRpcUrl = getOptValue(process.env.ETH_RPC_URL, "");

    this.ecdsaKeyFile = getOptValue(process.env.ECDSA_KEY_FILE, "");
    this.ecdsaKeyPass = getOptValue(process.env.ECDSA_KEY_PASSWORD, "");
    this.blsKeyFile = getOptValue(process.env.BLS_KEY_FILE, "");
    this.blsKeyPass = getOptValue(process.env.BLS_KEY_PASSWORD, "");

    this.registryCoordinatorAddress = getOptValue(process.env.REGISTRY_COORDINATOR_ADDRESS, "");
    this.operatorStateRetrieverAddress = getOptValue(process.env.OPERATOR_STATE_RETRIEVER_ADDRESS, "");

    this.earningsReceiver = getOptValue(process.env.EARNINGS_RECEIVER_ADDRESS, "");
    this.delegationApprover = getOptValue(process.env.DELEGATION_APPROVER_ADDRESS, "0x0000000000000000000000000000000000000000");
    this.metadataURI = getOptValue(process.env.METADATA_URI, "");

    this.operatorSignatureExpirySeconds = getOptValue(process.env.OPERATOR_SIGNATURE_EXPIRY_SECONDS, 3600);
    this.operatorSocketIpPort = getOptValue(process.env.OPERATOR_SOCKET_IP_PORT, "");

    this.nodeEnableNodeApi = getOptValue(process.env.NODE_ENABLE_NODE_API, false);
    this.nodeNodeApiPort = getOptValue(process.env.NODE_API_PORT, 9093);
    this.nodeEnableMetrics = getOptValue(process.env.NODE_ENABLE_METRICS, false);
    this.nodeMetricsPort = getOptValue(process.env.NODE_METRICS_PORT, 9094);

    // PADO
    this.dataMgtAddress = getOptValue(process.env.DATA_MANAGEMENT_ADDRESS, "");
    this.taskMgtAddress = getOptValue(process.env.TASK_MANAGEMENT_ADDRESS, "");
    this.workerMgtAddress = getOptValue(process.env.WORKER_MANAGEMENT_ADDRESS, "");
    this.routerAddress = getOptValue(process.env.ROUTER_ADDRESS, "");

    // AO
    this.lheKeyPath = getOptValue(process.env.LHE_KEY_PATH, "");
    this.arWalletPath = getOptValue(process.env.AR_WALLET_PATH, "");
    this.aoDataRegistryProcessId = getOptValue(process.env.AO_DATAREGISTRY_PROCESS_ID, "");
    this.aoNodeRegistryProcessId = getOptValue(process.env.AO_NODEREGISTRY_PROCESS_ID, "");
    this.aoTasksProcessId = getOptValue(process.env.AO_TASKS_PROCESS_ID, "");

    // ARWEAVE API CONFIG
    this.arweaveApiHost = getOptValue(process.env.ARWEAVE_API_CONFIG_HOST, "arweave.net");
    this.arweaveApiPort = getOptValue(process.env.ARWEAVE_API_CONFIG_PORT, 443);
    this.arweaveApiProtocol = getOptValue(process.env.ARWEAVE_API_CONFIG_PROTOCOL, "https");

    // storage
    this.dataStorageTypeEL = getOptValue(process.env.DATA_STORAGE_TYPE_EL, "ARSEEDING_ETH");
    this.dataStorageTypeAO = getOptValue(process.env.DATA_STORAGE_TYPE_AO, "ARSEEDING_AR");

    // Enables
    this.enableEigenLayer = getOptValue(process.env.ENABLE_EIGEN_LAYER, false);
    this.enableAO = getOptValue(process.env.ENABLE_AO, false);
  }
};

export class WorkerConfig extends EnvConfig {
  // @TODO the following variables have not written into .env
  avsName: string = "Node";
  nodeVersion: string = "v1.0.0";
  logLevel: string = "info";
  logFile: string = "./logs/worker.log";
  noPay: boolean = false;

  constructor() {
    super();
    if (getOptValue(process.env.EXECUTION_FLAG, "") === "DOCKER") {
      // reset the mapped path
      this.ecdsaKeyFile = "/pado-network/keys/ecdsa_key.json";
      this.blsKeyFile = "/pado-network/keys/bls_key.json";
      this.lheKeyPath = "/pado-network/keys/lhe_key.json";
      this.arWalletPath = "/pado-network/keys/ar_wallet.json";
    }

    // TODO: delete on production
    this.logLevel = "debug";
    this.noPay = true;
  }

};

