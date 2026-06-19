# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --omit=dev

# Copie du reste du code source
COPY . .

# Exposition du port
EXPOSE 4000

# Commande de démarrage
CMD ["node", "server.js"]