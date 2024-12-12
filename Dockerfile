FROM node:20 as dev

WORKDIR /app

# lightweight install, so that when files change, we cache installed packages
COPY package.json package-lock.json ./
RUN npm install --production

FROM node:20

WORKDIR /app

COPY . .
COPY --from=dev /app/node_modules ./node_modules/

CMD [ "node", "index.js" ]
HEALTHCHECK --interval=10s --timeout=2s --retries=3 CMD [ "node", "healthcheck.js" ]
