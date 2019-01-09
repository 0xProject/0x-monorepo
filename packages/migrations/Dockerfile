FROM mhart/alpine-node:10

WORKDIR /usr/src/app

RUN npm install -g ganache-cli@6.1.6

ENV MNEMONIC "concert load couple harbor equip island argue ramp clarify fence smart topic"
ENV NETWORK_ID 50
ENV VERSION "latest"
ENV SNAPSHOT_HOST "http://ganache-snapshots.0x.org.s3-website.us-east-2.amazonaws.com"
ENV SNAPSHOT_NAME "0x_ganache_snapshot"
EXPOSE 8545

CMD [ "sh", "-c", "wget $SNAPSHOT_HOST/$SNAPSHOT_NAME-$VERSION.zip -O snapshot.zip && unzip snapshot.zip && ganache-cli --gasLimit 10000000 --db $SNAPSHOT_NAME --noVMErrorsOnRPCResponse -p 8545 --networkId \"$NETWORK_ID\" -m \"$MNEMONIC\" -h 0.0.0.0"]

