ARG port

FROM node:18 AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate
RUN npx prisma migrate deploy

COPY . .

RUN npm run build


FROM node:18
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE $port

ENV NODE_ENV production
CMD ["npm", "run", "start:prod"]


