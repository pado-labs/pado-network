#!/bin/bash
curdir=$(pwd)

bash ./build.sh

cd test
npm run build
node dist/main.js
node dist/v1.js
node dist/v2.js

cd ${curdir}
