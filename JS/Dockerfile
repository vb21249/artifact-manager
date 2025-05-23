# Use Node.js as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install a simple HTTP server
RUN npm install -g http-server

# Copy project files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["http-server", "public", "-p", "3000", "--cors"]
