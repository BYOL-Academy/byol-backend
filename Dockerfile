# Stage 1: Build
FROM node:18-alpine AS builder

# Install npm
RUN corepack enable && corepack prepare npm@latest --activate

WORKDIR /app

# Copy only dependency files first for better caching
COPY npm-lock.yaml package.json ./
RUN npm install --frozen-lockfile

# Copy rest of the app files
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Install npm
RUN corepack enable && corepack prepare npm@latest --activate

WORKDIR /app

# Only production deps
COPY npm-lock.yaml package.json ./
RUN npm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/dist ./dist

# Copy .env as .env.production (if exists), default name is .env.development
COPY --from=builder /app/.env.development ./.env.development

EXPOSE ${PORT}

CMD ["node", "-r", "tsconfig-paths/register", "dist/src/server.js"]
