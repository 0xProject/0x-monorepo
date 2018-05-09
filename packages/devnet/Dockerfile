FROM alpine:3.7

RUN \
  apk add --update go git make gcc musl-dev linux-headers ca-certificates && \
  # TODO(albrow): Change the Git URL and branch once we have all relvant PRs
  # merged to upstream.
  git clone --depth 1 --branch sethead-txpool-fix https://github.com/0xProject/go-ethereum && \
  (cd go-ethereum && make geth) && \
  cp go-ethereum/build/bin/geth /geth && \
  apk del go git make gcc musl-dev linux-headers && \
  rm -rf /go-ethereum && rm -rf /var/cache/apk/*

RUN mkdir ~/devnet
WORKDIR ~/devnet

COPY genesis.json .
COPY node0/ ./node0

RUN /geth --datadir node0/ init genesis.json

EXPOSE 8501
EXPOSE 30310

ENTRYPOINT /geth --datadir node0/ --syncmode 'full' --nat none --nodiscover --port 30310 --rpc --rpcaddr '0.0.0.0' --rpcport 8501 --rpcapi 'personal,db,eth,net,web3,txpool,miner,debug' --networkid 22395 --gasprice '1' --unlock '35e52c375871faaa9923defbda5820dfa5aefc8f' --password node0/password.txt
