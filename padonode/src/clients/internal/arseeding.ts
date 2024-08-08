import { ArweaveSigner, EthereumSigner } from 'arseeding-js';
import { createAndSubmitItem } from 'arseeding-js/cjs/submitOrder';
import Arweave from 'arweave';
import { newEverpayByEcc, newEverpayByRSA, payOrder } from 'arseeding-js/cjs/payOrder';
import "./proxy.js"

const arseedingUrl = 'https://arseed.web3infra.dev';

const symbolTags = Object({
  'ethereum-usdt': 'ethereum-usdt-0xdac17f958d2ee523a2206206994597c13d831ec7',
  'ethereum-usdc': 'ethereum-usdc-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'ethereum-eth': 'ethereum-eth-0x0000000000000000000000000000000000000000',
  'ethereum-ar': 'arweave,ethereum-ar-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,0x4fadc7a98f2dc96510e42dd1a74141eeae0c1543',
});


const _submitDataToArseeding = async (data: Uint8Array, signer: any, pay: any, symbol: string, noPay: boolean) => {
  const options = {
    tags: [
      { name: 'k1', value: 'v1' },
      { name: 'Content-Type', value: 'application/octet-stream' }
    ]
  };

  const config = {
    signer: signer,
    path: '',
    arseedUrl: arseedingUrl,
    tag: symbolTags[symbol],
  };

  // @ts-ignore
  const order = await createAndSubmitItem(data.buffer, options, config);
  console.log('order', noPay ? 'without pay' : 'with pay', '\n', order);
  if (noPay) {
    return order.itemId;
  }

  //pay for order
  const everHash = await payOrder(pay, order);
  console.log('everHash:', everHash);

  return order.itemId;
};

export const submitDataToArseedingMetamask = async (data: Uint8Array, ecdsaPrivateKey: string, symbol: string, noPay: boolean) => {
  const signer = new EthereumSigner(ecdsaPrivateKey.substring(2));
  const pay = newEverpayByEcc(ecdsaPrivateKey);
  return await _submitDataToArseeding(data, signer, pay, symbol, noPay);
};

export const submitDataToArseedingArConnect = async (arweave: Arweave, data: Uint8Array, wallet: any, symbol: string, noPay: boolean) => {
  const signer = new ArweaveSigner(wallet);
  const address = await arweave.wallets.jwkToAddress(wallet);
  const pay = newEverpayByRSA(wallet, address);
  return await _submitDataToArseeding(data, signer, pay, symbol, noPay);
};

export const getDataFromArseeding = async (transactionId: string): Promise<Uint8Array> => {
  try {
    const response = await fetch(arseedingUrl + '/' + transactionId, { method: 'GET' });

    if (!response.ok) {
      console.log(response);
      throw new Error(`Get data failed! Status: ${response.status}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('get data failed:', error);
    throw error;
  }
};
