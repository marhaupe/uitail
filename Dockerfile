FROM node:20-slim AS frontend
RUN npm install -g pnpm
WORKDIR /app
COPY packages/frontend/package.json .
COPY packages/frontend/pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile
COPY packages/frontend/ .
RUN pnpm build
# Need to also set everything that static.go overrides since we're replacing the whole ssi block
RUN sed -i 's|<!--#echo var="configscript" -->|<script>window.config = {"backendURL": "https://uitail-demo.api.marhaupe.com", "command": "sh testlogger.sh"};</script>|' dist/index.html

FROM golang:1.23
WORKDIR /app
COPY packages/cli/ .
COPY --from=frontend /app/dist ./internal/static/dist
RUN go build
CMD ["./uitail", "sh testlogger.sh"]

