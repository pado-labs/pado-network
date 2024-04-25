# pado-node


## Quick Start


### Building


**NOTE:** the package `pado-ao-sdk` have not published, you should use `npm link` or copy the pado-ao-sdk's `dist/` folder to `./node_modules/` and rename to `pado-ao-sdk`.


```sh
npm install
npm run build
```


### KeyGen

```sh
node ./dist/keygen.js <name>
```


## Register public key



```sh
node ./dist/noderegister.js <name> <keyfile> <walletpath>
```


## Do task


```sh
node ./dist/nodetask.js <name> <keyfile> <walletpath>
```

- get a task
- do re-encrypt
- submit result

