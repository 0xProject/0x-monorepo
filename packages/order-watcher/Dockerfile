FROM node

WORKDIR /order-watcher

COPY package.json .
RUN npm i
RUN npm install forever -g

COPY . .

EXPOSE 8080

CMD ["forever", "./lib/src/server.js"]
