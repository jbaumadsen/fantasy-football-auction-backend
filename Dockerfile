# Use an official Node runtime as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

ENV MONGODB_URI=mongodb+srv://jqbaumadsen:xnUxma2khxWuopVl@cluster0.cvpu6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Define the command to run the app
CMD ["node", "server.js"]