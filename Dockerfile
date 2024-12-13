FROM node:20 as runner


WORKDIR /app

RUN mkdir -p /app/uploads
RUN chmod -R 777 /app/uploads

COPY package*.json .
COPY .env.sample .

RUN npm install

COPY src/ src/

CMD [ "npm", "run", "dev" ]

