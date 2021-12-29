FROM node:12.22-alpine

WORKDIR app
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
RUN yarn
COPY . .
RUN  yarn build

EXPOSE 9002
ENV PORT=9002
ENV NODE_ENV 'production'
ENV DATABASE_HOST "postgres"
ENV DATABASE_NAME "gwts"
ENV DATABASE_USER "docker"
ENV DATABASE_PORT 5432
ENV DATABASE_ACCESS_KEY "docker"
ENV LOG_LEVEL "info"
ENV JWT_SECRET=something
ENV JWT_REFRESH_SECRET=else

RUN  export NODE_ENV=production
CMD [ "node", "./dist/src/main.js"]
