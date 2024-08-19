
- [AO Worker](#ao-worker)
  - [Building](#building)
  - [Basic Configurations](#basic-configurations)
    - [Node Info](#node-info)
    - [Arweave Wallet](#arweave-wallet)
    - [LHE Key](#lhe-key)
  - [Storage](#storage)
  - [Register to PADO AO Process](#register-to-pado-ao-process)
  - [Run Task](#run-task)
  - [Add New Workers](#add-new-workers)
    - [Add EigenLayer Worker](#add-eigenlayer-worker)


# AO Worker


## Building


```sh
git clone https://github.com/pado-labs/pado-network.git
cd pado-network/padonode
npm install
npm run build
```

**NOTE**: *The minimum version of NodeJS required is 18+.*


## Basic Configurations

Copy `./config-files/.env.ao` into `./.env`. Edit the `./.env` and update the values for your own setups.


### Node Info

Set a name to identify yourself, these will be used on the node itself and will be shown on performance metrics in the future.

```sh
NODE_NAME="Your Node Name"
NODE_DESCRIPTION="Your Node Name's Description"
```


### Arweave Wallet

If you don't have an Arweave wallet, you can install one from [ArConnect](https://www.arconnect.io/download), and then export the wallet from ArConnect and store it to somewhere.

Next, fill in the file path of the Arweave wallet,

```sh
AR_WALLET_PATH='/path/to/your/arwallet.json'
```


### LHE Key

The LHE key is used for data sharing, use the following command to generate it.

```sh
node ./dist/cmd.js generate-lhe-key [--key-name <NAME>]
```

The default output is `./keys/default.lhe.key.json`, you can specify the key name via `--key-name <NAME>`.

**IMPORTANT!** Don't lose this file and save it to a safe place!

Next, fill in the file path of the LHE key you have generated.

```sh
LHE_KEY_PATH='/path/to/your/lhe.key.json'
```


## Storage

Storing data on a contract is expensive, so we are currently using [Arweave](https://www.arweave.org/) as the storage blockchain which is cheaper to store data.

By default, we can use Arweave directly. However, the Arweave ecosystem itself has [some issues](https://web3infra.dev/docs/arseeding/introduction/lightNode/#why-we-need-arseeding). In order **not** to suffer from these issues, we using [Arseeding](https://web3infra.dev/docs/arseeding/introduction/lightNode) instead.


In order to use Arseeding, we need to first transfer/deposit some AR to [everPay](https://app.everpay.io/), **which wallet corresponds to the Arweave wallet previously mentioned above**.

**Alternatively**, you can also deposit on EverPay with the following command:

```sh
node ./dist/cmd.js everpay:deposit --chain <CHAIN_TYPE> --symbol <SYMBOL> --amount <AMOUNT> --walletpath <PATH>
# e.g.:
# node ./dist/cmd.js everpay:deposit --chain arweave --symbol AR --amount 0.00001 --walletpath /path/to/your/arweave/wallet.json
```

Meanwhile, you can check the balance on EverPay by:

```sh
node ./dist/cmd.js everpay:balance --account <ACCOUNT_ADDRESS> [--symbol <SYMBOL>]
```


## Register to PADO AO Process

**NOTE:** *Please contact [PADO Labs](https://discord.gg/YxJftNRxhh) to add your wallet address to the WHITELIST before being able to successfully register!*

Once the configuration is complete, you can run:

```sh
node ./dist/cmd.js ao:register
```

<br/>

In general, you only need to perform the registry step once.


## Run Task

Once successfully registered, you can start the task program. If necessary, e.g. in a production environment, it is recommended to start the program as a background process.


```sh
node ./dist/main.js
# start it as a background process:
# nohup node ./dist/main.js >logfile 2>&1 &
```

Some logs will output to `./logs/*.log`.


## Add New Workers

### Add EigenLayer Worker

Reference the following difference parts of [EigenLayer Worker](./README-EigenLayerWorker.md):
- Register as Operator on EigenLayer
- Basic Configurations
- ECDSA and BLS Key
- Storage
- Register to PADO AVS

