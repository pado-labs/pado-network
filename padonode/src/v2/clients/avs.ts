import { Logger } from "pino";
import { ethers } from "ethers";
import { ELClient } from "./el";
import { BlsBn254 } from '../bls_bn254';
import { bitmapToQuorumIds } from "../utils";

export class AvsClient {
  constructor(
    // @ts-ignore
    private readonly ecdsaWallet: ethers.Wallet,
    // @ts-ignore
    private readonly elClient: ELClient,
    // @ts-ignore
    private readonly serviceManager: ethers.Contract,
    // @ts-ignore
    private readonly registryCoordinator: ethers.Contract,
    // @ts-ignore
    private readonly stakeRegistry: ethers.Contract,
    // @ts-ignore
    private readonly blsApkRegistry: ethers.Contract,
    // @ts-ignore
    private readonly logger: Logger,
  ) {
  }

  async getOperatorId(operator: string): Promise<string> {
    return await this.registryCoordinator.getOperatorId(operator);
  }

  async getOperatorFromId(operatorId: string): Promise<string> {
    return this.registryCoordinator.getOperatorFromId(operatorId);
  }

  async isOperatorRegistered(operator: string): Promise<boolean> {
    const operatorStatus = await this.registryCoordinator.getOperatorStatus(operator);
    return operatorStatus === 1;
  }

  async getOperatorStakeInQuorumsOfOperatorAtCurrentBlock(operatorId: string): Promise<Record<number, bigint>> {
    const quorumBitmap = await this.registryCoordinator.getCurrentQuorumBitmap(operatorId);
    const quorums = bitmapToQuorumIds(quorumBitmap);
    const quorumStakes: Record<number, bigint> = {};
    for (const quorum of quorums) {
      const stake: bigint = await this.stakeRegistry.getCurrentStake(operatorId, quorum);
      quorumStakes[quorum] = stake;
      // quorumStakes[quorum] = BigInt(randomInt(1, 10) * 100000000000000000);
    }
    return quorumStakes;
  }

  private async _getOperatorSignatureWithSaltAndExpiry(
    salt: string,
    expiry: number,
  ): Promise<any> {
    // Define the output structure
    let operatorSignature = {
      expiry: expiry,
      salt: salt,
      signature: ""
    };

    const digestHash = await this.elClient.calculateOperatorAVSRegistrationDigestHash(
      this.ecdsaWallet.address,
      this.serviceManager.address,
      salt,
      expiry
    );
    // console.log("digestHash:", digestHash);

    // Sign the digest hash with the operator's private key
    const signingKey = new ethers.utils.SigningKey(this.ecdsaWallet.privateKey);
    const signature = signingKey.signDigest(digestHash);

    // Encode the signature in the required format
    operatorSignature.signature = ethers.utils.joinSignature(signature);
    // console.log("operatorSignature:", operatorSignature);

    return operatorSignature;
  }

  private async _getPubkeyRegistrationParams(
    blsPrivateKey: string
  ): Promise<any> {
    const bls = await BlsBn254.create();

    const { secretKey, pubKeyG1, pubKeyG2 } = bls.createKeyPair(blsPrivateKey);
    // console.log("secretKey:", secretKey);
    // console.log(" pubKeyG1:", pubKeyG1);
    // console.log(" pubKeyG2:", pubKeyG2);


    const g1 = bls.serialiseG1Point(pubKeyG1);
    const g2 = bls.serialiseG2Point(pubKeyG2);
    // console.log("g1:", g1);
    // console.log("g2:", g2);

    const pubkeyRegistrationMessageHash = await this.registryCoordinator.pubkeyRegistrationMessageHash(this.ecdsaWallet.address);
    // console.log("pubkeyRegistrationMessageHash:", pubkeyRegistrationMessageHash);

    const { signature } = bls.signHashedToCurveMessage(
      pubkeyRegistrationMessageHash.X,
      pubkeyRegistrationMessageHash.Y,
      secretKey)
    const s = bls.serialiseG1Point(signature);
    // console.log("s:", s);

    const pubkeyRegParams = {
      pubkeyRegistrationSignature: { X: s[0], Y: s[1] },
      pubkeyG1: { X: g1[0], Y: g1[1] },
      pubkeyG2: { X: [g2[1], g2[0]], Y: [g2[3], g2[2]] }
    };
    // console.log("pubkeyRegParams:", pubkeyRegParams);

    return pubkeyRegParams;
  }

  /**
   * 
   * @param quorumNumbers 
   */
  async registerOperatorInQuorumWithAVSRegistryCoordinator(
    salt: string,
    expiry: number,
    blsPrivateKey: string,
    quorumNumbers: number[],
    socket: string,
  ): Promise<ethers.ContractReceipt | null> {
    console.log('call _getOperatorSignatureWithSaltAndExpiry');
    const operatorSignature = await this._getOperatorSignatureWithSaltAndExpiry(salt, expiry);
    // console.log("operatorSignature:", operatorSignature);

    console.log('call _getPubkeyRegistrationParams');
    const pubkeyRegParams = await this._getPubkeyRegistrationParams(blsPrivateKey);
    // console.log("pubkeyRegParams:", pubkeyRegParams);

    try {
      console.log("registerOperator start");
      const tx = await this.registryCoordinator.registerOperator(quorumNumbers, socket, pubkeyRegParams, operatorSignature);
      // console.log("registerOperator tx:\n", tx);
      const receipt = await tx.wait();
      // console.log("registerOperator receipt:\n", receipt);
      console.log("registerOperator successfully with transaction hash:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.log("registerOperator error:\n", error);
      try {
        const tx = await this.registryCoordinator.callStatic.registerOperator(quorumNumbers, socket, pubkeyRegParams, operatorSignature);
        console.log("registerOperator.callStatic tx:\n", tx);
      } catch (error) {
        console.log("registerOperator.callStatic error:\n", error);
      }
    }
    return null;
  }

  async deregisterOperator(
    quorumNumbers: number[],
  ): Promise<ethers.ContractReceipt | null> {
    this.logger.info("Deregistering operator with the AVS's registry coordinator");

    try {
      console.log("deregisterOperator start");
      const tx = await this.registryCoordinator.deregisterOperator(quorumNumbers);
      // console.log("deregisterOperator tx:\n", tx);
      const receipt = await tx.wait();
      // console.log("deregisterOperator receipt:\n", receipt);
      console.log("deregisterOperator successfully with transaction hash:", receipt.transactionHash);
      return receipt
    } catch (error) {
      console.log("deregisterOperator error:\n", error);
      try {
        const tx = await this.registryCoordinator.callStatic.deregisterOperator(quorumNumbers);
        console.log("deregisterOperator.callStatic tx:\n", tx);
      } catch (error) {
        console.log("deregisterOperator.callStatic error:\n", error);
      }
    }
    return null;
  }


};