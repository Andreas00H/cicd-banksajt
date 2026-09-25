FROM node:24-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Adressen till backend inuti Docker-nätverket. Behövs redan när sajten byggs,
# eftersom Next.js "bakar in" vidarekopplingen (rewrites) i bygget.
ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=$BACKEND_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]
