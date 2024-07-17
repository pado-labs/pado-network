import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { BlsBn254 } from './bls_bn254';
import { avsDirectoryABI } from './abis/avsDirectoryABI'; // AVSDirectory
import { delegationABI } from "./abis/delegationABI"; // DelegationManager
import { registryABI } from "./abis/registryABI"; // RegistryCoordinator
import { contractABI } from './abis/contractABI'; // ServiceManagerContract
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const avsDirectoryAddress = process.env.AVS_DIRECTORY_ADDRESS!;
const delegationManagerAddress = process.env.DELEGATION_MANAGER_ADDRESS!;
const registryCoordinatorAddress = process.env.REGISTRY_COORDINATOR_ADDRESS!;
const contractAddress = process.env.CONTRACT_ADDRESS!;

const avsDirectory = new ethers.Contract(avsDirectoryAddress, avsDirectoryABI, wallet);
const delegationManager = new ethers.Contract(delegationManagerAddress, delegationABI, wallet);
const registryContract = new ethers.Contract(registryCoordinatorAddress, registryABI, wallet);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

const blsSecretKey = process.env.BLS_SECRET_KEY as `0x${string}`;

/**
 * Operator Registration to EigenLayer
 * @TODO params
 */
export const registerAsOperator = async () => {
  const tx1 = await delegationManager.registerAsOperator({
    earningsReceiver: await wallet.address,
    delegationApprover: "0x0000000000000000000000000000000000000000",
    stakerOptOutWindowBlocks: 0
  }, "");
  await tx1.wait();
  console.log("Operator registered on EigenLayer successfully");
};


const _getOperatorSignatureWithSaltAndExpiry = async () => {
  const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const expiry = Math.floor(Date.now() / 1000) + 3600; // Example expiry, 1 hour from now

  // Define the output structure
  let operatorSignature = {
    expiry: expiry,
    salt: salt,
    signature: ""
  };

  // Calculate the digest hash using the avsDirectory's method
  const digestHash = await avsDirectory.calculateOperatorAVSRegistrationDigestHash(
    wallet.address,
    contract.address,
    salt,
    expiry
  );
  // console.log("digestHash:", digestHash);

  // Sign the digest hash with the operator's private key
  const signingKey = new ethers.utils.SigningKey(process.env.PRIVATE_KEY!);
  const signature1 = signingKey.signDigest(digestHash);

  // Encode the signature in the required format
  operatorSignature.signature = ethers.utils.joinSignature(signature1);


  return operatorSignature;
}

const _getPubkeyRegistrationParams = async () => {
  const bls = await BlsBn254.create();

  const { secretKey, pubKeyG1, pubKeyG2 } = bls.createKeyPair(blsSecretKey);
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
    ethers.utils.arrayify(pubkeyRegistrationMessageHash.X),
    ethers.utils.arrayify(pubkeyRegistrationMessageHash.Y),
    secretKey)
  const s = bls.serialiseG1Point(signature);
  // console.log("s:", s);

  const pubkeyRegParams = {
    pubkeyRegistrationSignature: {
      X: s[0],
      Y: s[1]
    },
    pubkeyG1: {
      X: g1[0],
      Y: g1[1]
    },
    pubkeyG2: {
      X: [g2[1], g2[0],
      ],
      Y: [g2[3], g2[2],
      ]
    }
  };
  // console.log("pubkeyRegParams:", pubkeyRegParams);

  return pubkeyRegParams;
}


/**
 * @TODO params
 */
export const registerOperatorInQuorumWithAVSRegistryCoordinator = async () => {
  // @TODO

  const operatorSignature = await _getOperatorSignatureWithSaltAndExpiry();
  // console.log("operatorSignature:", operatorSignature);

  const pubkeyRegParams = await _getPubkeyRegistrationParams();
  // console.log("pubkeyRegParams:", pubkeyRegParams);

  // @TODO
  const quorumNumbers = [0x00]; // Example quorum number, modify as needed
  const socket = "127.0.0.1:8000"; // Example socket, modify as needed
  // console.log("quorumNumbers:", quorumNumbers);
  // console.log("socket:", socket);

  try {
    console.log("registerOperator start");
    const tx = await registryContract.registerOperator(quorumNumbers, socket, pubkeyRegParams, operatorSignature);
    console.log("registerOperator tx:\n", tx);
    const receipt = await tx.wait();
    console.log("registerOperator receipt:\n", receipt);
  } catch (error) {
    console.log("registerOperator error:\n", error);
    try {
      const tx = await registryContract.callStatic.registerOperator(quorumNumbers, socket, pubkeyRegParams, operatorSignature);
      console.log("registerOperator.callStatic tx:\n", tx);
    } catch (error) {
      console.log("registerOperator.callStatic error:\n", error);
    }
  }
  console.log("Operator registered on AVS successfully");
};

const test = async () => {
  console.log("test registerOperator");

  try {
    await registerAsOperator();
  } catch (error) {
    console.log('registerAsOperator error:', error);
  }

  try {
    await registerOperatorInQuorumWithAVSRegistryCoordinator();
  } catch (error) {
    console.log('registerOperatorInQuorumWithAVSRegistryCoordinator error:', error);
  }


  try {
    const id = await registryContract.getOperatorId(wallet.address);
    console.log('getOperatorId:', id);
  } catch (error) {
    console.log('getOperatorId error:', error);
  }
};

test().catch((error) => {
  console.error("Error in test function:", error);
});
