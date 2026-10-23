# Multi-stage Dockerfile for WELLWITH CRM
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and subpackages
COPY package.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm --prefix server install
RUN npm --prefix client install

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Generate Prisma Client & Build
RUN npm --prefix server run prisma:generate
RUN npm --prefix server run build
RUN npm --prefix client run build

# Run seed data
RUN npm --prefix server run seed

# Production Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
