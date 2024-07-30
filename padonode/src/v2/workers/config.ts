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

  // AO
  lheKeyPath: string;
  arWalletPath: string;
  aoDataRegistryProcessId: string;
  aoNodeRegistryProcessId: string;
  aoTasksProcessId: string;


  // Enables
  enableEigenLayer: boolean;
  enableAO: boolean;


  constructor() {
    // Globals
    this.nodeName = getOptValue(process.env.NODE_NAME, "");
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

    // AO
    this.lheKeyPath = getOptValue(process.env.LHE_KEY_PATH, "");
    this.arWalletPath = getOptValue(process.env.AR_WALLET_PATH, "");
    this.aoDataRegistryProcessId = getOptValue(process.env.AO_DATAREGISTRY_PROCESS_ID, "");
    this.aoNodeRegistryProcessId = getOptValue(process.env.AO_NODEREGISTRY_PROCESS_ID, "");
    this.aoTasksProcessId = getOptValue(process.env.AO_TASKS_PROCESS_ID, "");

    // Enables
    this.enableEigenLayer = getOptValue(process.env.ENABLE_EIGEN_LAYER, true);
    this.enableAO = getOptValue(process.env.ENABLE_AO, true);
  }
};

export class WorkerConfig extends EnvConfig {
  avsName: string = "PADO";
  nodeVersion: string = "v1.0.0";
  constructor() {
    super();
  }

};

