FROM node

WORKDIR /src

RUN apt-get -qq update && apt-get install -y libhidapi-dev libusb-1.0-0-dev
COPY package.json .
RUN npm i
RUN npm install forever -g

COPY . .

EXPOSE 3000

CMD ["forever", "./bin/server.js"]
