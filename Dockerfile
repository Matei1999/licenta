# Build stage pentru frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Instalează PostgreSQL client tools (pentru healthcheck)
RUN apk add --no-cache postgresql-client

# Copiază backend dependencies
COPY package*.json ./
RUN npm install --production

# Copiază backend code
COPY backend ./backend

# Copiază frontend build din build stage
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Expune porturile
EXPOSE 5000 3000

# Environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start backend (frontend static served din backend)
CMD ["npm", "start"]
