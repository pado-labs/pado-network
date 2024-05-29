FROM node:20.12.2
LABEL maintainer="PADO Labs <dev@padolabs.org>"
WORKDIR /pado-network
COPY ./dist /pado-network/dist
COPY package.json /pado-network/package.json
RUN npm install
CMD [ "node", "/pado-network/dist/nodetask.js" ]


