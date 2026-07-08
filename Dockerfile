FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
EXPOSE 8790
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
