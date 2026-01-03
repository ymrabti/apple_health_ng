FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm i --legacy-peer-deps

# Copy source code
COPY . .

# Build the Angular app with optimizations
RUN npm run build -- --configuration production --output-hashing=all

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist/apple_health_social/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
