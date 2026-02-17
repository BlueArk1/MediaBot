# Dockerfile

FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install deps
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app code
COPY . .

# Expose no ports explicitly needed for Discord bot

# Health check (try Discord API ping via node)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node healthcheck.js || exit 1

# Start the bot
CMD ["node", "app.js"]