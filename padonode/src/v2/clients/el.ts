import { Logger } from "pino";
import { ethers } from "ethers";

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
      earningsReceiver: operator.earningsReceiverAddress,
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

