FROM --platform=$TARGETPLATFORM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM --platform=$TARGETPLATFORM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/.next ./.next/
COPY --from=build /app/public ./public/
COPY --from=build /app/node_modules ./node_modules/
COPY --from=build /app/package.json ./package.json

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "run", "start"]