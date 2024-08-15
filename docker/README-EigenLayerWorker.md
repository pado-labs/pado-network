- [EigenLayer Worker](#eigenlayer-worker)
  - [Register as Operator on EigenLayer](#register-as-operator-on-eigenlayer)
  - [Configurations](#configurations)
    - [Node Info](#node-info)
    - [ECDSA and BLS Key](#ecdsa-and-bls-key)
    - [LHE Key](#lhe-key)
  - [Storage](#storage)
  - [Registry](#registry)
    - [(Optional) Register as Operator on EigenLayer](#optional-register-as-operator-on-eigenlayer)
    - [Register to PADO AVS](#register-to-pado-avs)
    - [Get Operator ID](#get-operator-id)
  - [Run Task](#run-task)


# EigenLayer Worker


## Register as Operator on EigenLayer


**NOTE**: *You may skip this section if you are already a registered operator on the EigenLayer testnet and mainnet.*

This setup step focuses on generating ecdsa keys, bls keys, and registering yourself as an operator on EigenLayer.

Complete the following steps according to [EigenLayer guide](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation):


- [Install EigenLayer CLI](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#cli-installation).
- [Generate ECDSA and BLS keypair](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#create-and-list-keys). You can also import existing ECDSA and BLS keys.
- Fund some ETH to the ECDSA address above generated. These ETH will be used to cover the gas cost for operator registration in the subsequent steps.
- [Register on EigenLayer as an operator](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#operator-configuration-and-registration).


## Configurations

For the Ethernet Testnet(Holesky), copy `./config-files/.env.holesky` into `./.env`. Edit the `./.env` and update the values for your own setups.

**NOTE**: *If you plan to operate on Mainnet, then copy `.env.mainnet` instead of `.env.holesky`*.


<br/>

### Node Info

Set a name to identify yourself, these will be used on the node itself and will be shown on performance metrics in the future.

```conf
# Set a name to identify yourself
NODE_NAME="Your Node Name"
NODE_DESCRIPTION="Your Node Name's Description"
```

### ECDSA and BLS Key

Fill in the file path and password of the ECDSA and BLS key you have generated according to [here](#register-as-operator-on-eigenlayer).

```conf
#
# ECDSA and BLS KEY
# If you have some special characters in password, make sure to use single quotes
#
ECDSA_KEY_FILE=/path/to/keyname.ecdsa.key.json
ECDSA_KEY_PASSWORD=''

BLS_KEY_FILE=/path/to/keyname.bls.key.json
BLS_KEY_PASSWORD=''
```

### LHE Key

The LHE key is used for data sharing, use the following command to generate it.

```sh
bash ./run.sh generate-lhe-key [--key-name <NAME>]
```

The default output is `./keys/default.lhe.key.json`, you can specify the key name via `--key-name <NAME>`.


Next, fill in the file path of the LHE key you have generated.

```conf
#
# LHE KEY
# For task: data sharing
#
LHE_KEY_PATH='/path/to/your/lhe.key.json'
```


## Storage

Storing data on a contract is expensive, so we use [arweave](https://www.arweave.org/) which is cheaper to store data.

In order to use [Arseeding](https://web3infra.dev/docs/arseeding/introduction/lightNode), you need to first transfer some ETH to [everPay](https://app.everpay.io/), which wallet corresponds to the ecdsa key previously mentioned above.

Alternatively, you can deposit on EverPay with the following command:

```sh
# here set your own wallet path
export WALLET_PATH=/path/to/your/wallet.json
# here set your own AMOUNT
bash ./utils.sh everpay:deposit --chain ethereum --symbol ETH --amount <AMOUNT>
# e.g.:
# bash ./utils.sh everpay:deposit --chain ethereum --symbol ETH --amount 0.00001
```

Meanwhile, you can check the balance on EverPay by:

```sh
bash ./utils.sh everpay:balance --account <ACCOUNT_ADDRESS> --symbol ETH
```


## Registry

### (Optional) Register as Operator on EigenLayer

This is an optional way to register as operator on EigenLayer if you have not yet registered. We recommend registering using the method in the [previous](#register-as-operator-on-eigenlayer) section.

<br/>

The following parameters are relevant. All have default values, you may set them according to your actual needs.

```conf
#
# Register as Operator on EigenLayer by calling `DelegationManager.registerAsOperator`
#
# The address that will receive earnings as the Operator provides services to AVSs. Default: wallet.address
EARNINGS_RECEIVER_ADDRESS=
# The Delegation Approver. Default: address(0).
# See: https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#delegationapprover-design-patterns
DELEGATION_APPROVER_ADDRESS=
# The metadata url of the operator. Default: ""
METADATA_URI=
```

Once the configuration is complete, you can run:

```sh
bash ./run.sh el:register-as-operator
```

### Register to PADO AVS

**NOTE:** *Please contact [PADO Labs](https://discord.gg/YxJftNRxhh) to add your wallet address to the WHITELIST before being able to successfully register!*


The relevant parameters and default values.

```conf
#
# For `RegistryCoordinator.registerOperatorInQuorumWithAVSRegistryCoordinator`
#
# Time after which the operator's signature becomes invalid. Default: 3600
OPERATOR_SIGNATURE_EXPIRY_SECONDS=
# The operator socket. Default: ""
OPERATOR_SOCKET_IP_PORT=
```


```sh
# special a quorum id or quorum id list split by comma. e.g.:
# bash ./run.sh el:register 0
# bash ./run.sh el:register 0,1
bash ./run.sh el:register [--quorum-id-list <ID>]
```

**NOTE**: PADO AVS now only supports quorum ids of `0`.

<br/>

In general, you only need to perform the registry steps once.


### Get Operator ID

Once you have successfully registered to avs, you can get the operator id by:

```sh
bash ./run.sh el:get-operator-id
```


## Run Task

Once successfully registered, you can start the task program. If necessary, e.g. in a production environment, it is recommended to start the program as a background process.


```sh
bash ./run.sh dotask [<name>]
```

The container-name is `pado-network[-name]`.

