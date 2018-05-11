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

ENTRYPOINT /geth --datadir node0/ --syncmode 'full' --nat none --nodiscover --port 30310 --rpc --rpcaddr '0.0.0.0' --rpcport 8501 --rpcapi 'personal,db,eth,net,web3,txpool,miner,debug' --networkid 50 --gasprice '1' --targetgaslimit '0x47b760' --unlock '0x5409ed021d9299bf6814279a6a1411a7e866a631,0x6ecbe1db9ef729cbe972c83fb886247691fb6beb,0xe36ea790bc9d7ab70c55260c66d52b1eca985f84,0xe834ec434daba538cd1b9fe1582052b880bd7e63,0x78dc5d2d739606d31509c31d654056a45185ecb6,0xa8dda8d7f5310e4a9e24f8eba77e091ac264f872,0x06cef8e666768cc40cc78cf93d9611019ddcb628,0x4404ac8bd8f9618d27ad2f1485aa1b2cfd82482d,0x7457d5e02197480db681d3fdf256c7aca21bdc12,0x91c987bf62d25945db517bdaa840a6c661374402,35e52c375871faaa9923defbda5820dfa5aefc8f' --password=node0/password.txt
