- [PADO Node](#pado-node)
  - [Building](#building)
  - [Setup](#setup)
  - [Configurations](#configurations)
  - [Quick Start](#quick-start)
    - [(Optional) Register as Operator on EigenLayer](#optional-register-as-operator-on-eigenlayer)
    - [Register to PADO AVS](#register-to-pado-avs)
    - [Get Operator ID](#get-operator-id)


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

Complete the following steps according to [EigenLayer guide](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation):

**NOTE**: *You may skip the following steps if you are already a registered operator on the EigenLayer testnet and mainnet.*


- [Install EigenLayer CLI](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#cli-installation).
- [Generate ECDSA and BLS keypair](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#create-and-list-keys). You can also import existing ECDSA and BLS keys.
- Fund some ETH to the ECDSA address above generated. These ETH will be used to cover the gas cost for operator registration in the subsequent steps.
- [Register on EigenLayer as an operator](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation#operator-configuration-and-registration).


## Configurations

Copy `./config-files/.env.holesky` into `./.env`. Edit the `./.env` and update the values for your setup.

**NOTE**: *If you plan to operate on Mainnet, then copy `.env.mainnet` instead of `.env.holesky`*.


<br/>

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


## Quick Start

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


### Get Operator ID

```sh
npm run get-operator-id
```
