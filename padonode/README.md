# pado-node

## Building


```sh
npm install
npm run build
```

## Key and Wallet

### Generate Key

Generate a pair of keys(public key and secret key) for encryption and decryption and store them to a file.

```sh
node ./dist/keygen.js <keyfile>
```

- keyfile: a json file path to store the keys.


**IMPORTANT!** Don't lose this file and save it to a safe place!



### Create Wallet (Optional)

If you don't have an Arweave wallet, you can install one from [ArConnect](https://www.arconnect.io/download), and then export the wallet from ArConnect and store it to somewhere.

Alternatively, it is possible to generate an Arweave wallet with the following command:

```sh
node -e "require('arweave').init({}).wallets.generate().then(JSON.stringify).then(console.log.bind(console))" > wallet.json
```

**IMPORTANT!** Don't lose this file and save it to a safe place!



## Register Node Public Key


**NOTE:** Please contact [PADO](https://discord.gg/YxJftNRxhh) to add your wallet address to the **WHITELIST** before being able to successfully register!

You can get you Arweave wallet address from ArConnect or by:

```sh
node ./dist/getwalletaddress.js <walletpath>
```

- walletpath: your Arweave wallet file path.


<br/>

Register the node's public key to ao process.


```sh
node ./dist/noderegister.js <keyfile> <walletpath> <name>
```

- keyfile: your key file.
- walletpath: your Arweave wallet file path.
- name: take a node name of your liking.

If the output is like `already register ...`, it means that this node name has already been registered.


<br/>

In general, you only need to perform the above steps once.


## Do task

Once successfully registered, you can start the task program.

```sh
node ./dist/nodetask.js <keyfile> <walletpath>
```

- keyfile: your key file.
- walletpath: your Arweave wallet file path.


