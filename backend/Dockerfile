FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm cache clean --force && npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8002

# Start the application
CMD ["npm", "start"]