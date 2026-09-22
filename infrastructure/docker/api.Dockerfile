FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api-server/package.json apps/api-server/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm install
COPY . .
RUN npm run build --workspace apps/api-server
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "apps/api-server"]
