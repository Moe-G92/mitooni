# syntax=docker/dockerfile:1
# Context: prepare_context.py output only; never the broad repository/review tree.
FROM node:22.23.2-bookworm-slim AS web
WORKDIR /build/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY web/index.html web/tsconfig.json web/vite.config.ts ./
COPY web/src ./src
COPY web/scripts/account-build-boundary.ts ./scripts/account-build-boundary.ts
ARG VITE_MITOONI_AUTH_URL
ARG VITE_MITOONI_AUTH_PUBLISHABLE_KEY
ENV VITE_MITOONI_AUTH_URL=$VITE_MITOONI_AUTH_URL \
    VITE_MITOONI_AUTH_PUBLISHABLE_KEY=$VITE_MITOONI_AUTH_PUBLISHABLE_KEY \
    VITE_MITOONI_API_BASE=""
RUN node --input-type=module -e 'import fs from "node:fs"; try { const url=new URL(process.env.VITE_MITOONI_AUTH_URL); if(url.protocol!=="https:" || url.username || url.password || url.search || url.hash || url.pathname!=="/" || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(process.env.VITE_MITOONI_AUTH_PUBLISHABLE_KEY??"")) throw Error("Public receiving build configuration required"); fs.writeFileSync("/build/build-auth.json",JSON.stringify({authUrl:url.origin})); } catch { console.error("Public receiving build configuration required"); process.exit(1); }' \
    && npm run build

FROM ghcr.io/astral-sh/uv:0.9.27 AS uv
FROM python:3.13.11-slim-bookworm AS runtime
RUN apt-get update && apt-get install --yes --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY platform/backend/deployment/learner-beta/supabase-root-2021.crt /usr/local/share/ca-certificates/mitooni-supabase-root-2021.crt
RUN echo "700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7  /usr/local/share/ca-certificates/mitooni-supabase-root-2021.crt" | sha256sum --check --status \
    && update-ca-certificates
COPY --from=uv /uv /usr/local/bin/uv
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_NO_CACHE=1 UV_PYTHON_DOWNLOADS=never \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
WORKDIR /srv/backend
COPY platform/backend/pyproject.toml platform/backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project \
    && groupadd --gid 10001 mitooni && useradd --uid 10001 --gid 10001 --no-create-home mitooni
COPY platform/backend/app ./app
COPY platform/backend/deployment/learner-beta/entrypoint.py ./beta_entrypoint.py
COPY --from=web /build/web/dist /srv/web
COPY --from=web /build/build-auth.json /srv/build-auth.json
# The assembler emits exact-file ignore rules for this validated curated edition.
COPY private-learner/ /srv/private/learner/
RUN chmod -R a-w /srv/web /srv/private /srv/backend/app /srv/backend/beta_entrypoint.py \
    && chmod -R a+rX /srv/private
USER 10001:10001
CMD ["/srv/backend/.venv/bin/python", "/srv/backend/beta_entrypoint.py"]
