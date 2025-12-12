# Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Setup Backend & Serve
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend ./
# Copy built frontend assets to backend's public folder (needs configuration in server.ts to serve this)
# For now, we will assume generic structure or just copy to dist/public
COPY --from=frontend-build /app/frontend/dist ./dist/public

# Compile Backend
RUN npm run build || npx tsc

EXPOSE 3000
CMD ["node", "dist/server.js"]
