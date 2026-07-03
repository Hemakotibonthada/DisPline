# The Daily Execution System — single-image build (client + API server)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
# Persist the JSON store to a mounted volume when DATA_DIR is set.
ENV DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "server/index.js"]
