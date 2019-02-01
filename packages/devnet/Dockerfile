FROM alpine:3.7

RUN \
  apk add --update go git make gcc musl-dev linux-headers ca-certificates && \
  # TODO(albrow): Change the Git URL and branch once we have all relvant PRs
  # merged to upstream.
  git clone --depth 1 --branch '0x-testing' https://github.com/0xProject/go-ethereum && \
  (cd go-ethereum && make geth) && \
  cp go-ethereum/build/bin/geth /geth && \
  apk del go git make gcc musl-dev linux-headers && \
  rm -rf /go-ethereum && rm -rf /var/cache/apk/*

RUN mkdir ~/devnet
WORKDIR ~/devnet

COPY genesis.json .
COPY node0/ ./node0
COPY run.sh .

RUN /geth --datadir node0/ init genesis.json

EXPOSE 8501
EXPOSE 30310

ENTRYPOINT ./run.sh
