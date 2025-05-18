# Use Node.js base image
FROM node:18-alpine

# Declare build args for env vars
ARG MONGODB_URI
ARG EMAIL_USER
ARG EMAIL_PASS
ARG JWT_SECRET
ARG CRYPTO_KEY
ARG NEXT_PUBLIC_CRYPTO_KEY

# Set env vars in container runtime environment
ENV MONGODB_URI=${MONGODB_URI}
ENV EMAIL_USER=${EMAIL_USER}
ENV EMAIL_PASS=${EMAIL_PASS}
ENV JWT_SECRET=${JWT_SECRET}
ENV CRYPTO_KEY=${CRYPTO_KEY}
ENV NEXT_PUBLIC_CRYPTO_KEY=${NEXT_PUBLIC_CRYPTO_KEY}

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the entire project
COPY . .

# Build Next.js project
RUN npm run build

# Expose and run
EXPOSE 3000
CMD ["npm", "start"]
