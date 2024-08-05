import Arweave from 'arweave';
import { bundleAndSignData, createData, ArweaveSigner, Bundle } from "arbundles";

type createTransactionParamsTuple = [{ data: any }, any?];
type signParamsTuple = [any, any?];
const use_arbundles = false; // TODO:


// submit data to AR
export const submitDataToAR = async (arweave: Arweave, data: string | Uint8Array, wallet: any) => {
  let _data = data;
  if (use_arbundles) {
    const signer = new ArweaveSigner(wallet);
    const dataItems = [createData(data, signer)];
    const bundle = await bundleAndSignData(dataItems, signer);
    data = bundle.getRaw();
  }
  let createTransactionParams: createTransactionParamsTuple = [
    {
      data: _data
    }
  ];
  let signParams: signParamsTuple = [undefined];
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // This is Node.js
    createTransactionParams[1] = wallet;
    signParams[1] = wallet;
  }
  // Create a data transaction
  let transaction = await arweave.createTransaction(...createTransactionParams);
  signParams[0] = transaction;
  // Optional. Add tags to a transaction
  // GraphQL uses tags when searching for transactions.
  transaction.addTag('Type', 'PADO-EncryptedData');

  // Sign a transaction
  await arweave.transactions.sign(...signParams);

  // Submit a transaction
  let uploader = await arweave.transactions.getUploader(transaction);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
  }

  return transaction.id;
};

export const getDataFromAR = async (arweave: Arweave, transactionId: string): Promise<Uint8Array> => {
  const res = (await arweave.transactions.getData(transactionId, { decode: true })) as Uint8Array;
  if (use_arbundles) {
    const bundle = new Bundle(Buffer.from(res));
    const data = bundle.get(0);
    return new Uint8Array(data.rawData);
  } else {
    return res;
  }
};
