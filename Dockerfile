FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

COPY docker/start.sh /usr/local/bin/start

RUN chmod +x /usr/local/bin/start

EXPOSE 4000

ENTRYPOINT ["start"]