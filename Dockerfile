FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --production

# Copy server code and the public folder (HTML)
COPY server.js ./
COPY public ./public

RUN mkdir data
EXPOSE 3000
CMD ["npm", "start"]