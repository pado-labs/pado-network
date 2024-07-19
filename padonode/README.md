- [PADO Node](#pado-node)
  - [Building](#building)
  - [Preparations](#preparations)
  - [Configurations](#configurations)
  - [Quick Start](#quick-start)
    - [Register as Operator on EigenLayer](#register-as-operator-on-eigenlayer)
    - [Register to AVS](#register-to-avs)
    - [Get Operator ID](#get-operator-id)


# PADO Node


Under developing.


## Building


```sh
npm install
npm run build
```

## Preparations

TODO: ECDSA Key and BLS Key. 

## Configurations

TODO:


## Quick Start


### Register as Operator on EigenLayer

```sh
npm run register:as-operator
```

### Register to AVS

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
