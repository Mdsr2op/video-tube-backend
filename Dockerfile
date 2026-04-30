# ---------- Stage 1: install production dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only manifest files first for better Docker layer caching.
# This layer only rebuilds when package.json or package-lock.json change.
COPY package*.json ./

# Install ONLY production deps (no nodemon, no prettier).
RUN npm ci --omit=dev

# ---------- Stage 2: runtime image ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Create a non-root user for security. Running Node as root inside a
# container is a common mistake — if the app gets compromised, the
# attacker has root inside the container.
RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

# The app writes uploaded files here before pushing them to Cloudinary.
RUN mkdir -p /app/public/temp && chown -R nodeapp:nodejs /app

# Copy installed deps from the deps stage and the application source.
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --chown=nodeapp:nodejs package*.json ./
COPY --chown=nodeapp:nodejs src/ ./src/
COPY --chown=nodeapp:nodejs public/ ./public/

USER nodeapp

# The app reads PORT from env; this is just documentation for Kubernetes.
EXPOSE 4000

ENV NODE_ENV=production

# Run the app directly with node — no nodemon in production.
CMD ["node", "src/index.js"]
