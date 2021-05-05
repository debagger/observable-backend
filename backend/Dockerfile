FROM node:lts
WORKDIR /home/backend
COPY ./src ./src/
COPY ["package.json", "nest-cli.json", "tsconfig.build.json", "tsconfig.json", "./"]
RUN npm i
RUN npm run build
CMD dist/main