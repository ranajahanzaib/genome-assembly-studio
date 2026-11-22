# Deployment Guide — Genome Assembly Studio

Genome Assembly Studio is containerized for seamless deployment using Docker Compose, Kubernetes, or cloud container platforms.

---

## 1. Quickstart with Docker Compose

To start the full application stack (API and Next.js Frontend):

```bash
docker compose up -d --build
```

### Services Launched:

- **`genome-studio-api`**: Runs the FastAPI server with integrated Rust `genome-studio` CLI on port `8000`.
- **`genome-studio-web`**: Runs the optimized Next.js 15 production server on port `3000`.

Check health:

```bash
curl http://localhost:8000/api/v1/health
```

Access the application:

```text
http://localhost:3000
```

---

## 2. Production Environment Variables

| Variable              | Default                             | Purpose                                                             |
| --------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`        | `sqlite:///./data/genome_studio.db` | Database connection string (PostgreSQL or SQLite).                  |
| `DATA_DIR`            | `/app/data`                         | Persistent filesystem location for uploaded assemblies and indices. |
| `GENOME_STUDIO_BIN`   | `/usr/local/bin/genome-studio`      | Absolute path to compiled Rust binary.                              |
| `SEED_DEMO_DATA`      | `true`                              | Seeds initial benchmark fixtures upon fresh database creation.      |
| `ENVIRONMENT`         | `production`                        | Environment mode (`development` or `production`).                   |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1`      | URL accessed by browser clients to query the API.                   |

---

## 3. PostgreSQL & Redis Production Scalability

For high-throughput enterprise or institutional deployments, configure PostgreSQL for persistent relational storage and Redis for Celery/RQ job worker queues:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: genome_studio
      POSTGRES_USER: studio
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    environment:
      - DATABASE_URL=postgresql://studio:${DB_PASSWORD}@postgres:5432/genome_studio
      - REDIS_URL=redis://redis:6379/0
```

---

## 4. Reverse Proxy & SSL (Nginx / Caddy)

Example Caddyfile for automatic HTTPS:

```caddyfile
genome-studio.yourdomain.org {
    handle /api/* {
        reverse_proxy api:8000
    }
    handle {
        reverse_proxy web:3000
    }
}
```
