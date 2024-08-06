FROM node:16-alpine AS builder

RUN mkdir /app

RUN apk update && apk upgrade && apk add yarn git

WORKDIR /app

COPY . .

RUN yarn install

RUN yarn build


FROM node:16-alpine

RUN apk update && apk upgrade && apk add yarn git

COPY package.json .

COPY yarn.lock .

RUN yarn install --production

COPY --from=builder /app .

EXPOSE 8080

ENV NODE_ENV production

CMD ["yarn", "start"]
