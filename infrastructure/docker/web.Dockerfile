FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/web-dashboard/package.json apps/web-dashboard/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm install
COPY . .
RUN npm run build --workspace apps/web-dashboard
EXPOSE 5173
CMD ["npm", "run", "preview", "--workspace", "apps/web-dashboard", "--", "--host", "0.0.0.0"]
