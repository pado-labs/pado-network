/**
 * Interact with EigenLayer Contracts
 */
import { Logger } from "pino";
import { ethers } from "ethers";
import { registryCoordinatorABI } from "../abis/registryCoordinatorABI";
import { stakeRegistryABI } from "../abis/stakeRegistryABI";
import { delegationManagerABI } from "../abis/delegationManagerABI";
import { slasherABI } from "../abis/slasherABI";
import { strategyManagerABI } from "../abis/strategyManagerABI";
import { serviceManagerABI } from "../abis/serviceManagerABI";
import { avsDirectoryABI } from "../abis/avsDirectoryABI";

export type Operator = {
  address: string, // The operator address
  earningsReceiverAddress: string, // default: ""
  delegationApproverAddress: string, // default: ""
  stakerOptOutWindowBlocks: number,
  metadataUrl: string, // default: ""
};
export class ELClient {
  constructor(
    // @ts-ignore
    private readonly delegationManager: ethers.Contract,
    // @ts-ignore
    private readonly slasher: ethers.Contract,
    // @ts-ignore
    private readonly strategyManager: ethers.Contract,
    // @ts-ignore
    private readonly avsDirectory: ethers.Contract,
    // @ts-ignore
    private readonly logger: Logger,
  ) {

  }

  async isOperatorRegistered(operator: string): Promise<boolean> {
    const isOperator: boolean = await this.delegationManager.isOperator(operator);
    return isOperator;
  }

  async operatorIsFrozen(operator: string): Promise<boolean> {
    const isFrozen: boolean = await this.slasher.isFrozen(operator);
    return isFrozen;
  }

  async calculateOperatorAVSRegistrationDigestHash(
    operator: string, // address
    avs: string, // address
    salt: string, // bytes32
    expiry: number, // uint256
  ): Promise<string> {
    return await this.avsDirectory.calculateOperatorAVSRegistrationDigestHash(
      operator,
      avs,
      salt,
      expiry,
    ) as string;
  }


  /**
   * Operator Registration to EigenLayer
   */
  // receipt, error
  async registerAsOperator(operator: Operator): Promise<ethers.ContractReceipt | null> {
    // this.logger.info(`Registering operator ${operator.address} to EigenLayer`);

    const registeringOperatorDetails = {
      __deprecated_earningsReceiver: operator.earningsReceiverAddress,
      delegationApprover: operator.delegationApproverAddress,
      stakerOptOutWindowBlocks: operator.stakerOptOutWindowBlocks,
    };
    // console.log("registeringOperatorDetails", registeringOperatorDetails)
    // console.log("metadataURI", metadataURI)

    try {
      console.log("registerAsOperator start");
      const tx = await this.delegationManager.registerAsOperator(registeringOperatorDetails, operator.metadataUrl);
      // console.log("registerAsOperator tx:\n", tx);
      const receipt = await tx.wait();
      // TransactionReceipt
      // console.log("registerAsOperator receipt:\n", receipt);
      console.log("registerAsOperator successfully with transaction hash:", receipt.transactionHash);

      return receipt;
    } catch (error) {
      console.log("registerAsOperator failed:", error);
      // this.logger.error("An error occurred when registering operator", e);
    }
    return null;
  }
};


export async function buildELClient(
  ecdsaWallet: ethers.Wallet,
  registryCoordinatorAddress: string,
  logger: Logger,
): Promise<ELClient> {
  // console.log('registryCoordinatorAddress', registryCoordinatorAddress);
  const registryCoordinator = new ethers.Contract(registryCoordinatorAddress, registryCoordinatorABI, ecdsaWallet);
  // console.log('registryCoordinator', registryCoordinator);

  const stakeRegistryAddress: string = await registryCoordinator.stakeRegistry();
  // console.log('stakeRegistryAddress', stakeRegistryAddress);
  const stakeRegistry = new ethers.Contract(stakeRegistryAddress, stakeRegistryABI, ecdsaWallet);
  // console.log('stakeRegistry', stakeRegistry);

  const delegationManagerAddress: string = await stakeRegistry.delegation();
  // console.log('delegationManagerAddress', delegationManagerAddress);
  const delegationManager = new ethers.Contract(delegationManagerAddress, delegationManagerABI, ecdsaWallet);
  // console.log('delegationManager', delegationManager);

  const slasherAddress: string = await delegationManager.slasher();
  // console.log('slasherAddress', slasherAddress);
  const slasher = new ethers.Contract(slasherAddress, slasherABI, ecdsaWallet);
  // console.log('slasher', slasher);

  const strategyManagerAddress: string = await delegationManager.strategyManager();
  // console.log('strategyManagerAddress', strategyManagerAddress);
  const strategyManager = new ethers.Contract(strategyManagerAddress, strategyManagerABI, ecdsaWallet);
  // console.log('strategyManager', strategyManager);

  const serviceManagerAddress: string = await registryCoordinator.serviceManager();
  // console.log('serviceManagerAddress', serviceManagerAddress);
  const serviceManager = new ethers.Contract(serviceManagerAddress, serviceManagerABI, ecdsaWallet);
  // console.log('serviceManager', serviceManager);

  const avsDirectoryAddress: string = await serviceManager.avsDirectory();
  // console.log('avsDirectoryAddress', avsDirectoryAddress);
  const avsDirectory = new ethers.Contract(avsDirectoryAddress, avsDirectoryABI, ecdsaWallet);
  // console.log('avsDirectory', avsDirectory);

  const elClient = new ELClient(
    delegationManager,
    slasher,
    strategyManager,
    avsDirectory,
    logger,
  );

  return elClient;
}
