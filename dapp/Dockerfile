FROM node:12.13.0

WORKDIR /app

# cache dependencies in layer
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install

COPY . /app
RUN npm run build

VOLUME /export

ENTRYPOINT rm -rf /export/dai-hrd; cp -r -p /app/app /export/dai-hrd
