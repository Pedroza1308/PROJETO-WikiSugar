# Node 22 LTS (o Expo SDK 58 exige Node ^22.13)
FROM node:22-alpine

WORKDIR /app

# ngrok: usado apenas no modo "--tunnel ngrok" (veja .env.example)
RUN npm install -g @expo/ngrok@^4.1.0

# Copiar dependencias primeiro para aproveitar o cache do Docker.
# npm ci instala exatamente o que esta no package-lock.json.
COPY mobile/package*.json ./
RUN npm ci

# Copiar o restante do projeto mobile (o node_modules local fica de fora via .dockerignore)
COPY mobile/ .

# Metro Bundler
EXPOSE 8081

# O modo (lan/tunel) e definido pelo docker-compose.yml via EXPO_START_ARGS
CMD ["npx", "expo", "start", "--lan"]
