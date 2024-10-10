FROM node:20-slim AS frontend
RUN npm install -g pnpm
WORKDIR /app
COPY packages/frontend/package.json .
COPY packages/frontend/pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile
COPY packages/frontend/ .
RUN pnpm build

FROM golang:1.23
COPY --from=frontend /app/dist ./dist
WORKDIR /app
COPY packages/cli/ .
RUN go build
CMD ["./uitail", "sh testlogger.sh"]

