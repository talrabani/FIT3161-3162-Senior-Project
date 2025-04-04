FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# First, ensure all dependencies including pg are installed
RUN npm install && \
    # Verify pg installation explicitly
    npm list pg || npm install pg && \
    # Install any additional required system packages for pg
    apk add --no-cache python3 make g++

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
