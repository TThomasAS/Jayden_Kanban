# syntax=docker/dockerfile:1
# ---------- Étape 1 : build (TypeScript -> JavaScript) ----------
FROM node:20-alpine AS build
WORKDIR /app

# Installation des dépendances (dev incluses pour compiler) - couche mise en cache
COPY package.json package-lock.json ./
RUN npm ci

# Copie du code source et compilation vers dist/
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---------- Étape 2 : image de production ----------
FROM node:20-alpine AS production
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

# Dépendances de production uniquement
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Code compilé uniquement (pas de sources TS, pas de tests)
COPY --from=build /app/dist ./dist

# Sécurité : exécution avec l'utilisateur non-root fourni par l'image node
USER node

EXPOSE 3000

# Vérifie que l'API répond (utilisé par Docker / docker compose)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
