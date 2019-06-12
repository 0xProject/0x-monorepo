FROM mhart/alpine-node:10

WORKDIR /usr/src/app

RUN npm install -g ganache-cli@6.4.4-beta.0

COPY 0x_ganache_snapshot/ ./0x_ganache_snapshot

ENV MNEMONIC "concert load couple harbor equip island argue ramp clarify fence smart topic"
ENV NETWORK_ID 50
ENV VERSION "latest"
ENV SNAPSHOT_NAME "0x_ganache_snapshot"
EXPOSE 8545

CMD [ "sh", "-c", "ganache-cli --gasLimit 10000000 --db $SNAPSHOT_NAME --noVMErrorsOnRPCResponse -p 8545 --networkId \"$NETWORK_ID\" -m \"$MNEMONIC\" -h 0.0.0.0"]

