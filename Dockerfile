# ---- Stage 1: Build the application ----
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy the rest of your application
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Stage 2: Production image ----
# ---- Stage 2: Production image ----
FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Only copy public if it exists
# COPY --from=builder /app/public ./public


#use docker run -p 4000:3000 --name my-app-container --env-file .env my-node-app

EXPOSE 3000
CMD ["npm", "start"]
