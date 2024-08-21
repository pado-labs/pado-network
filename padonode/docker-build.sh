#！/bin/bash
if ! type node >/dev/null 2>&1; then
  echo "Please install nodejs with version > 18"
  exit 1
fi

npm install
npm run build

ver=$(cat package.json | grep version | grep -Eo "[0-9]+\.[0-9]+\.[0-9]+")
if [ $ver ]; then
  tag=v${ver}
  docker build -t padolabs/pado-network:${tag} . -f Dockerfile.build
fi

docker build -t padolabs/pado-network:latest . -f Dockerfile.build
# docker build --progress=plain --no-cache -t padolabs/pado-network:latest . -f Dockerfile.build
exit 0
