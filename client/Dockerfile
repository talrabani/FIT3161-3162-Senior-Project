# current lts version that node recommends for docker setup on linux
FROM node:22-alpine

# set the working directory in the container
WORKDIR /app

# copy package.json and packge-lock.json to the working directory
COPY package*.json ./

# install dependencies
RUN npm install

# copy the rest of the front-end files to the working directory
COPY . .

# expose the port the app runs on
EXPOSE 5173

# Use --host flag to bind to all interfaces and enable polling for hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
