# Usar uma versão de Node.js LTS compatível com o SDK 52
FROM node:20-alpine

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos de dependência primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instalar as dependências usando a flag legada para evitar erros de peer dependencies
RUN npm install --legacy-peer-deps

# Copiar o restante dos arquivos do projeto mobile
COPY . .

# Expor a porta padrão do Metro Bundler (8081) e do Expo (19000, 19001, 19002)
EXPOSE 8081 19000 19001 19002

# Comando padrão para iniciar o Expo em modo host
CMD ["npx", "expo", "start", "--host", "lan"]