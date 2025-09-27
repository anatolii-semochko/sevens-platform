FROM node:20.18.0-alpine

WORKDIR /app/node-server

# Copy node-server package files first
COPY node-server/package*.json ./

# Install dependencies
RUN npm install

# Copy node-server source code
COPY node-server/ ./

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
