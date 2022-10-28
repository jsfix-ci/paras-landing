FROM node:f7ef5856dc1f AS deps

WORKDIR /opt/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:f7ef5856dc1f AS builder

ENV NODE_ENV=production
WORKDIR /opt/app
COPY . .
COPY .env.temp .env
COPY --from=deps /opt/app/node_modules ./node_modules
RUN yarn build

FROM node:f7ef5856dc1f AS runner

WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=builder /opt/app/next.config.js ./
COPY --from=builder /opt/app/public ./public
COPY --from=builder /opt/app/.next ./.next
COPY --from=builder /opt/app/node_modules ./node_modules

ENTRYPOINT ["node_modules/.bin/next", "start"]
