# syntax=docker/dockerfile:1

# The server is plain JavaScript, so there is no build output to carry between
# stages — only production dependencies. Installing them in their own stage
# keeps the dev dependencies and the npm cache out of the final image.
FROM node:22-alpine AS deps

WORKDIR /app

# Copied alone so a source change does not invalidate the dependency layer.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund


FROM node:22-alpine AS runtime

# No package installs in this stage on purpose: the image builds on a machine
# with no route to the Alpine mirrors, and an init system is not needed here.
# Node is PID 1 and handles SIGTERM itself (see src/index.js), and it reaps its
# own cluster workers. Where a reaper is wanted anyway, run with `--init`, which
# compose.yaml sets.

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    MCP_HOST=0.0.0.0 \
    PORT=3000 \
    MCP_PATH=/mcp \
    MCP_SESSION_MODE=stateless \
    MCP_WORKERS=auto

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY content ./content
COPY LICENSE ./

# node:alpine already ships an unprivileged `node` user. Nothing here writes to
# disk at runtime — the content is read once at boot — so the whole tree stays
# owned by root and readable, not writable, by the process.
USER node

EXPOSE 3000

# Readiness, not liveness: the process is useless until the instruction set has
# loaded, and this endpoint only answers 200 once it has.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
