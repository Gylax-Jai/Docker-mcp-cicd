# ── Stage: Base Node image ──────────────────────────────
# Using lightweight Alpine Linux version of Node
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (so npm install is cached if code doesn't change)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port Express listens on
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
