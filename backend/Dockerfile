FROM node:22-alpine

# Prisma's schema engine (migrations) needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

# Generates the client, applies pending migrations, seeds, then starts in watch mode.
CMD ["npm", "run", "docker:dev"]
