# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy server dependencies and install
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy client dependencies and install
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source code
COPY . .

# Build the React client
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "run", "render-start"]
