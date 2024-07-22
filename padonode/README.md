- [PADO Node](#pado-node)
  - [Building](#building)
  - [Setup](#setup)
  - [Configurations](#configurations)
  - [Quick Start](#quick-start)
    - [(Optional) Register as Operator on EigenLayer](#optional-register-as-operator-on-eigenlayer)
    - [Register to PADO AVS](#register-to-pado-avs)
    - [Get Operator ID](#get-operator-id)


# PADO Node


Under developing.


## Building


```sh
npm install
npm run build
```

## Setup

Follow [EigenLayer guide](https://docs.eigenlayer.xyz/eigenlayer/operator-guides/operator-installation):
- Install EigenLayer CLI.
- Generate ECDSA and BLS keypair. (Or import existing ECDSA and BLS keys)
- Fund some ETH to the ECDSA address above generated. These ETH will be used to cover the gas cost for operator registration in the subsequent steps.
- Register on EigenLayer as an Operator. (You will need to do it once)


## Configurations

Copy `.env.example` to `.env`.


- Holesky

```conf
RPC_URL=https://1rpc.io/holesky

AVS_DIRECTORY_ADDRESS=0x055733000064333CaDDbC92763c58BF0192fFeBf
DELEGATION_MANAGER_ADDRESS=0xA44151489861Fe9e3055d95adC98FbD462B948e7

REGISTRY_COORDINATOR_ADDRESS=0x9A8Cd787251189ED13B188Dae92a79c3b4B23fDF
CONTRACT_ADDRESS=0xb6988aebe11e88cb2D93d9E557795A2fDE68A8B5
```

- Ecdsa and Bls Key

```conf
#
# ECDSA and BLS KEY
# If you have some special characters in password, make sure to use single quotes
#
ECDSA_KEY_FILE=/path/to/<keyname>.ecdsa.key.json
ECDSA_KEY_PASSWORD=''

BLS_KEY_FILE=/path/to/<keyname>.bls.key.json
BLS_KEY_PASSWORD=''
```

- (Optional) Register as Operator

The following parameters have default values, you can set them according to your actual needs.

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


- Register to PADO AVS

The following parameters have default values, you can set them according to your actual needs.

```conf
#
# For `RegistryCoordinator.registerOperatorInQuorumWithAVSRegistryCoordinator`
#
# Time after which the operator's signature becomes invalid. Default: 3600
OPERATOR_SIGNATURE_EXPIRY_SECONDS=
# The operator socket. Default: ""
OPERATOR_SOCKET_IP_PORT=
```


## Quick Start


### (Optional) Register as Operator on EigenLayer

This is an optional way to register as Operator on EigenLayer.

```sh
npm run register:as-operator
```

### Register to PADO AVS

```sh
# special a quorum id or quorum id list split by comma. e.g.:
# npm run register:avs 0
# npm run register:avs 0,1
npm run register:avs <quorum-id-List>
```

### Get Operator ID

```sh
npm run get-operator-id
```
