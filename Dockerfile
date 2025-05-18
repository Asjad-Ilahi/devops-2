# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the entire project
COPY . .
COPY .env.local ./

# Build Next.js project
RUN npm run build

# Expose and run
EXPOSE 3000
CMD ["npm", "start"]
