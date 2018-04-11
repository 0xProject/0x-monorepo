FROM node

WORKDIR /src

COPY package.json .
RUN npm i
RUN npm install forever -g

COPY . .

EXPOSE 3000

CMD ["forever", "./bin/server.js"]
