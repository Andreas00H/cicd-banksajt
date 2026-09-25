# Banksajt med Docker

**Publicerad sajt:** http://13.61.15.216

Banksajten (Next.js + Express + MySQL) körs i tre Docker-containrar som startas tillsammans med Docker Compose. På servern ligger nginx framför, så att sajten nås på vanliga port 80 utan portnummer.

## Containrar

| Tjänst     | Image                                           | Uppgift                                                                        |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `frontend` | byggs från `frontend/Dockerfile` (node:24-slim) | Next.js-sajten. Den enda tjänsten som är öppen utåt.                           |
| `backend`  | byggs från `backend/Dockerfile` (node:24-slim)  | Express-API:t. Nås bara inifrån Docker-nätverket via namnet `backend`.         |
| `mysql`    | `mysql:8.4`                                     | Databasen. Data sparas i volymen `mysql-data` och finns kvar mellan omstarter. |

- Frontend anropar sin egen adress (till exempel `/users`), och Next.js skickar vidare anropen till `http://backend:3001` inuti Docker-nätverket. Därför behöver backend ingen öppen port.
- `database/init.sql` skapar tabellerna `users`, `accounts` och `sessions` första gången MySQL-containern startar.
- Backend väntar på att MySQL är redo (`depends_on` med `service_healthy`) innan den startar.
- Alla containrar har `restart: unless-stopped`, så de startar igen om servern startas om.

## Köra lokalt

Docker Desktop är det enda som behövs.

```bash
docker compose up -d --build
```

- Sajten: http://localhost:3000
- MySQL från egen dator: `localhost:3307`

Stoppa med `docker compose down`. Radera även databasens data med `docker compose down --volumes`.

## Publicering på AWS EC2

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-v2 docker-buildx
git clone https://github.com/Andreas00H/docker-banksajt.git
cd docker-banksajt
echo "FRONTEND_PORT=127.0.0.1:3004" > .env
sudo docker compose up -d --build
sudo docker ps
```

På servern körs sedan tidigare två andra versioner av banken på port 3000 och 3002. Därför styrs frontendens port av variabeln `FRONTEND_PORT` i en `.env`-fil (som inte laddas upp till GitHub). Docker-banken lyssnar på `127.0.0.1:3004`, alltså bara inifrån servern, och nginx visar den utåt.

Jag behövde också utöka serverns disk från 8 till 20 GB (i AWS och med `growpart` och `resize2fs`), eftersom Docker-images för Node och MySQL tar mycket plats.

## VG: nginx på port 80

nginx fungerar som en reverse proxy: den tar emot besökare på port 80 och skickar vidare till Docker-banken på port 3004.

```bash
sudo apt install -y nginx
```

`/etc/nginx/sites-available/banksajt`:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
```
