# Zahra Admin

Admin dashboard built with React and Vite.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Dokploy Deployment

This repository is configured for Docker-based deployment in Dokploy.

Set this environment variable in Dokploy before deploying:

- `VITE_API_URL`: your backend API base URL (for example, `https://api.sakeenapress.org`)

### Required files

- `Dockerfile`: multi-stage build (Node build + Nginx runtime)
- `nginx.conf`: serves the built app and handles SPA route fallback
- `.dockerignore`: keeps Docker context small
- `.env.example`: documents required build-time environment values
- `docker-compose.yml`: optional if you deploy via Dokploy Compose mode

### Dokploy app settings

- Source: your Git repository
- Branch: `main` (or your release branch)
- Build type: `Dockerfile`
- Port: `80`
- Health check path: `/`

### What this setup does

- Runs `npm ci` and `npm run build` during image build
- Serves `dist` with Nginx
- Supports React Router deep links with `try_files ... /index.html`
- Injects `VITE_API_URL` at build time for the frontend API client

### Optional: local Docker test

```bash
docker build -t zahra-admin .
docker run --rm -p 8080:80 zahra-admin
```

Then open `http://localhost:8080`.
