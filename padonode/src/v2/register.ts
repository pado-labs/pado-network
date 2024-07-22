import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { BlsBn254 } from './bls_bn254';
import { getOptValue, getPrivateKey } from './utils';
import { avsDirectoryABI } from './abis/avsDirectoryABI'; // Contract: AVSDirectory
import { delegationABI } from "./abis/delegationABI"; // Contract: DelegationManager
import { registryABI } from "./abis/registryABI"; // Contract: RegistryCoordinator
dotenv.config();

// Ecdsa wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const ecdsaPrivateKey = getPrivateKey(getOptValue(process.env.ECDSA_KEY_FILE, ""), getOptValue(process.env.ECDSA_KEY_PASSWORD, ""));
const wallet = new ethers.Wallet(ecdsaPrivateKey, provider);


// Contracts Address
const avsDirectoryAddress = process.env.AVS_DIRECTORY_ADDRESS!;
const delegationManagerAddress = process.env.DELEGATION_MANAGER_ADDRESS!;
const registryCoordinatorAddress = process.env.REGISTRY_COORDINATOR_ADDRESS!;
const serverManagerAddress = process.env.SERVER_MANAGER_ADDRESS!;

// Contracts
const avsDirectory = new ethers.Contract(avsDirectoryAddress, avsDirectoryABI, wallet);
const delegationManager = new ethers.Contract(delegationManagerAddress, delegationABI, wallet);
const registryContract = new ethers.Contract(registryCoordinatorAddress, registryABI, wallet);


/**
 * Operator Registration to EigenLayer
 */
export const registerAsOperator = async () => {
  const earningsReceiver = getOptValue(process.env.EARNINGS_RECEIVER_ADDRESS, wallet.address);
  const delegationApprover = getOptValue(process.env.DELEGATION_APPROVER_ADDRESS, "0x0000000000000000000000000000000000000000");
  const metadataURI = getOptValue(process.env.METADATA_URI, "");

  const registeringOperatorDetails = {
    earningsReceiver,
    delegationApprover,
    stakerOptOutWindowBlocks: 0
  };
  // console.log("registeringOperatorDetails", registeringOperatorDetails)
  // console.log("metadataURI", metadataURI)

  try {
    console.log("registerAsOperator start");
    const tx = await delegationManager.registerAsOperator(registeringOperatorDetails, metadataURI);
    // console.log("registerAsOperator tx:\n", tx);
    const receipt = await tx.wait();
    // console.log("registerAsOperator receipt:\n", receipt);
    console.log("registerAsOperator successfully with transaction hash:", receipt.hash);
  } catch (error) {
    console.log("registerAsOperator failed:", error);
  }
};


const _getOperatorSignatureWithSaltAndExpiry = async () => {
  const signatureExpirySeconds = getOptValue(process.env.OPERATOR_SIGNATURE_EXPIRY_SECONDS, 3600);
  const expiry = Math.floor(Date.now() / 1000) + signatureExpirySeconds;
  const salt = ethers.hexlify(ethers.randomBytes(32));

  // Define the output structure
  let operatorSignature = {
    expiry: expiry,
    salt: salt,
    signature: ""
  };

  // Calculate the digest hash using the avsDirectory's method
  const digestHash = await avsDirectory.calculateOperatorAVSRegistrationDigestHash(
    wallet.address,
    serverManagerAddress,
    salt,
    expiry
  );
  // console.log("digestHash:", digestHash);

  // Sign the digest hash with the operator's private key
  const signature = wallet.signingKey.sign(digestHash);

  // Encode the signature in the required format
  operatorSignature.signature = signature.serialized;
  // console.log("operatorSignature:", operatorSignature);

  return operatorSignature;
}

const _getPubkeyRegistrationParams = async () => {
  const bls = await BlsBn254.create();

  let blsPrivateKey = getPrivateKey(getOptValue(process.env.BLS_KEY_FILE, ""), getOptValue(process.env.BLS_KEY_PASSWORD, ""));
  const { secretKey, pubKeyG1, pubKeyG2 } = bls.createKeyPair(blsPrivateKey);
  blsPrivateKey = "";
  // console.log("secretKey:", secretKey);
  // console.log(" pubKeyG1:", pubKeyG1);
  // console.log(" pubKeyG2:", pubKeyG2);


  const g1 = bls.serialiseG1Point(pubKeyG1);
  const g2 = bls.serialiseG2Point(pubKeyG2);
  // console.log("g1:", g1);
  // console.log("g2:", g2);

  const pubkeyRegistrationMessageHash = await registryContract.pubkeyRegistrationMessageHash(wallet.address);
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
export const registerOperatorInQuorumWithAVSRegistryCoordinator = async (
  quorumNumbers: Uint8Array
) => {
  console.log('call _getOperatorSignatureWithSaltAndExpiry');
  const operatorSignature = await _getOperatorSignatureWithSaltAndExpiry();
  // console.log("operatorSignature:", operatorSignature);

  console.log('call _getPubkeyRegistrationParams');
  const pubkeyRegParams = await _getPubkeyRegistrationParams();
  // console.log("pubkeyRegParams:", pubkeyRegParams);

  const socket = getOptValue(process.env.OPERATOR_SOCKET_IP_PORT, "");
  const quorum = ethers.hexlify(new Uint8Array(quorumNumbers));

  try {
    console.log("registerOperator start");
    const tx = await registryContract.registerOperator(quorum, socket, pubkeyRegParams, operatorSignature);
    // console.log("registerOperator tx:\n", tx);
    const receipt = await tx.wait();
    // console.log("registerOperator receipt:\n", receipt);
    console.log("registerOperator successfully with transaction hash:", receipt.hash);
  } catch (error) {
    console.log("registerOperator error:\n", error);
    try {
      const tx = await registryContract.registerOperator.staticCall(quorum, socket, pubkeyRegParams, operatorSignature);
      console.log("registerOperator.callStatic tx:\n", tx);
    } catch (error) {
      console.log("registerOperator.callStatic error:\n", error);
    }
  }

};

/**
 * 
 * @param operator 
 */
export const getOperatorId = async (operator: string | undefined) => {
  operator = getOptValue(operator, wallet.address);
  try {
    const id = await registryContract.getOperatorId(operator);
    console.log('getOperatorId:', id);
  } catch (error) {
    console.log("getOperatorId error:\n", error);
  }
}

