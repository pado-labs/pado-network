- [PADO Node](#pado-node)
  - [Building](#building)
  - [Key and Wallet](#key-and-wallet)
    - [Generate Key](#generate-key)
    - [Create Wallet (Optional)](#create-wallet-optional)
  - [Register Node Public Key](#register-node-public-key)
  - [Do task](#do-task)
- [Appendix](#appendix)
  - [Create Wallet](#create-wallet)
    - [Arweave](#arweave)
    - [Sepolia](#sepolia)


# PADO Node


**NOTE:** If you want to run pado-network node in docker, please refer to [Deploy by Docker](./README_DOCKER.md).

## Building


```sh
npm install
```

## Key and Wallet

### Generate Key

Generate a pair of keys(public key and secret key) for encryption and decryption and store them to a file.

```sh
node ./dist/keygen.js <keyfile>
```

- keyfile: JSON file path to store the keys in the container.


**IMPORTANT!** Don't lose this file and save it to a safe place!



### Create Wallet (Optional)

If you don't have a wallet, you can refer [Create Wallet](#create-wallet) to get one.


## Register Node Public Key


**NOTE:** Please contact [PADO Labs](https://discord.gg/YxJftNRxhh) to add your wallet address to the **WHITELIST** before being able to successfully register!

Register the node's public key to ao process.


```sh
node ./dist/noderegister.js <keyfile> <walletpath> <name> [<desc>] [<network>]
```

- keyfile: Path to the key file.
- walletpath: Path to the Arweave wallet file.
- name: The name of the node.
- desc: The description of the node. The default value is `the description of ${name}`.
- network: The network. The options are Arweave(default), Sepolia, All.

If the output is like `register ... by ...`, it means that the node has been successfully registered. If the output is like `already register ...`, it means that this node name has already been registered.

<br/>

In general, you only need to perform the above steps once.


## Do task

Once successfully registered, you can start the task program. If necessary, e.g. in a production environment, it is recommended to start the program as a background process.

```sh
node ./dist/nodetask.js <keyfile> <walletpath> [<network>]
# If you want to start it as a background process:
# nohup ./dist/nodetask.js <keyfile> <walletpath> >logfile &
```

- keyfile: Path to the key file.
- walletpath: Path to the Arweave wallet file.
- network: The network. The options are Arweave(default), Sepolia, All.


# Appendix

## Create Wallet

### Arweave

If you don't have an Arweave wallet, you can install one from [ArConnect](https://www.arconnect.io/download), and then export the wallet from ArConnect and store it to somewhere.

Alternatively, it is possible to generate an Arweave wallet with the following command:

```sh
node -e "require('arweave').init({}).wallets.generate().then(JSON.stringify).then(console.log.bind(console))" > wallet.json
```

**IMPORTANT!** Don't lose this file and save it to a safe place!


You can get you Arweave wallet address from ArConnect or by:

```sh
node ./dist/getwalletaddress.js <walletpath>
```

- walletpath: Path to the Arweave wallet file.


### Sepolia

If you don't have an Sepolia wallet, you can refer [MetaMask](https://metamask.io/) to create one. 

Next, launching MetaMask and simply need to switch from the Ethereum mainnet to Sepolia.


