- [PADO Node](#pado-node)
  - [Building](#building)
  - [Setup](#setup)
  - [Configurations](#configurations)
    - [ECDSA and BLS Key](#ecdsa-and-bls-key)
    - [LHE Key](#lhe-key)
    - [AR Wallet](#ar-wallet)
  - [Registry](#registry)
    - [(Optional) Register as Operator on EigenLayer](#optional-register-as-operator-on-eigenlayer)
    - [Register to PADO AVS](#register-to-pado-avs)
    - [Get Operator ID](#get-operator-id)
  - [Run Task](#run-task)
  - [Other Variables](#other-variables)


# PADO Node


## Building


```sh
git clone https://github.com/pado-labs/pado-network.git
cd pado-network/padonode
npm install
npm run build
```

**NOTE**: *The minimum version of NodeJS required is 18+.*


## Setup

This setup step focuses on generating ecdsa keys, bls keys, and registering yourself as an operator on EigenLayer.

Complete the following steps according to [EigenLayer guide](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation):

**NOTE**: *You may skip the following steps if you are already a registered operator on the EigenLayer testnet and mainnet.*


- [Install EigenLayer CLI](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#cli-installation).
- [Generate ECDSA and BLS keypair](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#create-and-list-keys). You can also import existing ECDSA and BLS keys.
- Fund some ETH to the ECDSA address above generated. These ETH will be used to cover the gas cost for operator registration in the subsequent steps.
- [Register on EigenLayer as an operator](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#operator-configuration-and-registration).


## Configurations

For the Ethernet Testnet(Holesky), copy `./config-files/.env.holesky` into `./.env`. Edit the `./.env` and update the values for your own setups.

**NOTE**: *If you plan to operate on Mainnet, then copy `.env.mainnet` instead of `.env.holesky`*.


<br/>

### ECDSA and BLS Key

Fill in the file path and password of the ECDSA and BLS key you have generated according to [Setup](#setup).

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

LHE key is used for data sharing, use the following command to generate it.

```sh
npm run generate-lhe-key [--output  <FILEPATH>]
```

The default generation is to `./lhe.key.json`, you can specify the output file via `--output  <FILEPATH>`.


Next, fill in the file path of the LHE key you have generated.

```conf
#
# LHE KEY
# For task: data sharing
#
LHE_KEY_PATH='/path/to/your/lhe.key.json'
```


### AR Wallet

We need to use two types of wallets, the previously mentioned Ethereum wallet and the AR wallet for data storage. 

If you don't have an AR wallet, you can install one from [ArConnect](https://www.arconnect.io/download), and then export the wallet from ArConnect and store it to somewhere.


Next, fill in the file path of the AR wallet.

```conf
#
# AR Wallet, for storage
#
export AR_WALLET_PATH='/path/to/your/arwallet.json'
```

**NOTE**: as with the previously mentioned ethereum wallet, fund some AR to the wallet.



## Registry

### (Optional) Register as Operator on EigenLayer

This is an optional way to register as operator on EigenLayer if you have not yet registered. We recommend registering using the method in the [Setup](#setup) section.

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
npm run register:as-operator
```

### Register to PADO AVS

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
# npm run register:pado-avs 0
# npm run register:pado-avs 0,1
npm run register:pado-avs <quorum-id-List>
```

**NOTE**: PADO AVS now only supports quorum ids of `0`.

<br/>

In general, you only need to perform the registry steps once.


### Get Operator ID

Once you have successfully registered to avs, you can get the operator id by:

```sh
npm run get-operator-id
```


## Run Task

Once successfully registered, you can start the task program. If necessary, e.g. in a production environment, it is recommended to start the program as a background process.


```sh
npm run task
# If you want to start it as a background process:
# nohup npm run task >logfile &
```

## Other Variables


