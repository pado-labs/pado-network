- [EigenLayer Worker](#eigenlayer-worker)
  - [Building](#building)
  - [Register as Operator on EigenLayer](#register-as-operator-on-eigenlayer)
  - [Basic Configurations](#basic-configurations)
    - [Node Info](#node-info)
    - [ECDSA and BLS Key](#ecdsa-and-bls-key)
    - [LHE Key](#lhe-key)
  - [Storage](#storage)
  - [Register to PADO AVS](#register-to-pado-avs)
  - [Run Task](#run-task)
  - [Add New Workers](#add-new-workers)
    - [Add AO Worker](#add-ao-worker)
  - [Utilities](#utilities)
    - [Worker Withdraw](#worker-withdraw)


# EigenLayer Worker


## Building


```sh
git clone https://github.com/pado-labs/pado-network.git
cd pado-network/padonode
npm install
npm run build
```

**NOTE**: *The minimum version of NodeJS required is 18+.*


## Register as Operator on EigenLayer


**NOTE**: *You may skip this section if you are already a registered operator on the EigenLayer testnet and mainnet.*

This setup step focuses on generating ecdsa key, bls key, and registering yourself as an operator on EigenLayer.

Complete the following steps according to [EigenLayer guide](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation):


- [Install EigenLayer CLI](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#cli-installation).
- [Generate ECDSA and BLS keypair](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#create-and-list-keys). You can also import existing ECDSA and BLS keys.
- **Fund some ETH to the ECDSA address** above generated. These ETH will be used to cover the gas cost for operator registration and doing task in the subsequent steps.
- [Register on EigenLayer as an operator](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#operator-configuration-and-registration).


## Basic Configurations

For the Ethernet Testnet(Holesky), copy `./config-files/.env.holesky` into `./.env`. Edit the `./.env` and update the values for your own setups.

**NOTE**: *Currently only supports Holesky.*

### Node Info

Set a name to identify yourself, these will be used on the node itself and will be shown on performance metrics in the future.

```sh
NODE_NAME="Your Node Name"
NODE_DESCRIPTION="Your Node Name's Description"
```

### ECDSA and BLS Key

Fill in the file path and password of the ECDSA and BLS key you have generated according to [Register as Operator on EigenLayer](#register-as-operator-on-eigenlayer).

```sh
ECDSA_KEY_FILE=/path/to/keyname.ecdsa.key.json
ECDSA_KEY_PASSWORD=''

BLS_KEY_FILE=/path/to/keyname.bls.key.json
BLS_KEY_PASSWORD=''
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


In order to use Arseeding, we need to first transfer/deposit some ETH to [everPay](https://app.everpay.io/), **which wallet corresponds to the ecdsa key previously mentioned above**.

**Alternatively**, you can also deposit on EverPay with the following command:

```sh
node ./dist/cmd.js everpay:deposit --chain <CHAIN_TYPE> --symbol <SYMBOL> --amount <AMOUNT> --walletpath <PATH>
# e.g.:
# node ./dist/cmd.js everpay:deposit --chain ethereum --symbol ETH --amount 0.00001 --walletpath /path/to/your/ethereum/wallet.json
```

Meanwhile, you can check the balance on EverPay by:

```sh
node ./dist/cmd.js everpay:balance --account <ACCOUNT_ADDRESS> [--symbol <SYMBOL>]
```


## Register to PADO AVS

If you have registered as an operator on the EigenLayer, you can register to the AVS of PADO.

**NOTE:** *Please contact [PADO Labs](https://discord.gg/YxJftNRxhh) to add your wallet address to the WHITELIST before being able to successfully register!*


The following parameters are relevant. All have default values, you may set them according to your actual needs.

```sh
# Time after which the operator's signature becomes invalid. Default: 3600
OPERATOR_SIGNATURE_EXPIRY_SECONDS=
# The operator socket. Default: ""
OPERATOR_SOCKET_IP_PORT=
```

Next, register the operator to AVS by:

```sh
# special a quorum id or quorum id list split by comma. e.g.:
# node ./dist/cmd.js el:register 0
# node ./dist/cmd.js el:register 0,1
node ./dist/cmd.js el:register [--quorum-id-list <ID>]
```

**NOTE**: The PADO AVS now only supports quorum ids of `0`. The default value of `quorum-id-list` is `0`.

<br/>

In general, you only need to perform the registry step once.


<br/>

Once you have successfully registered to avs, you can get the operator id by:

```sh
node ./dist/cmd.js el:get-operator-id
```


## Run Task

Once successfully registered, you can start the task program. If necessary, e.g. in a production environment, it is recommended to start the program as a background process.


```sh
node ./dist/main.js
# start it as a background process:
# nohup node ./dist/main.js >logfile 2>&1 &
```

Some logs will output to `./logs/*.log`.

## Add New Workers

### Add AO Worker

Step 1: Reference `./config-files/.env.ao`, mainly copy and append the following options and their value to `.env`:

```sh
ENABLE_AO
AO_DATAREGISTRY_PROCESS_ID
AO_NODEREGISTRY_PROCESS_ID
AO_TASKS_PROCESS_ID
AR_WALLET_PATH
```

Step 2: Set your own `AR_WALLET_PATH`. Reference [Arweave Wallet](./README-AOWorker.md#arweave-wallet).

Step 3: Register to PADO AO Process. Reference [Register to PADO AO Process](./README-AOWorker.md#register-to-pado-ao-process).

Step 4: Re-run the task. Reference [Run Task](#run-task).

<br/>

You can see the full configuration options from `./config-files/.env.holesky-and-ao`.


## Utilities

### Worker Withdraw

As a worker, you'll get some tokens for each task you complete.

You can get the balance(free, locked) by:

```sh
node ./dist/cmd.js worker:balance
```

and withdraw by (If no amount is specified, the entire free balance is withdrawn):

```sh
node ./dist/cmd.js worker:withdraw [--amount <AMOUNT>]
```
