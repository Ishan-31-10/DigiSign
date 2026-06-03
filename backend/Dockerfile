FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Default storage location inside container (mounted via volume in compose)
RUN mkdir -p /app/storage && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
