FROM node

WORKDIR /src

# Ledger Provider (in the Subproviders package) requires node-hid at dependency install time
# which compiles and expects certain USB developer library packages to be present
RUN apt-get -qq update && apt-get install -y libhidapi-dev libusb-1.0-0-dev
# Our fork of ledgerco disables requiring node-hid at run time if CIRCLECI is set to true
ENV CIRCLECI=true
COPY package.json .
RUN npm i
RUN npm install forever -g

COPY . .

EXPOSE 3000

CMD ["forever", "./bin/server.js"]
