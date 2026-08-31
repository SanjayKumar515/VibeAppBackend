FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port (Render sets process.env.PORT automatically, but default to 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
