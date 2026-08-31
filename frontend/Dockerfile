# ── Stage 1: Build the React app ────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the production React bundle (outputs to /app/dist)
RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────
# Nginx is a tiny, fast web server - perfect for serving static files
FROM nginx:alpine

# Copy built React files into Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (handles React routing + API proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
