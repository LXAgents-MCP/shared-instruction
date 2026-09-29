# syntax=docker/dockerfile:1

# The payload is a directory of markdown and a few kilobytes of JavaScript.
# There is no build step, so this is a single stage: a builder stage would copy
# the same files twice to produce a smaller context, not a smaller image.
FROM node:22-alpine

# Lifecycle scripts are disabled. The package declares none, and running them
# by default is supply-chain risk with nothing to offset it. `--omit=dev` keeps
# the test-only tree out of the image; `.dockerignore` already excludes the
# test files themselves, so this image cannot run its own suite.
#
# Dependencies are installed from the lockfile only. `npm ci` fails rather than
# silently resolving something the lockfile does not contain, which is the point
# of building an image from a versioned tree.
WORKDIR /srv

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

# `content/` is the product. It is copied, not generated, and it is the only
# thing in this image that a change to the repository is expected to alter.
COPY src ./src
COPY content ./content

# Not root. The process reads files and answers JSON-RPC, and nothing else.
USER node

# stdio is the only transport, so there is no port to declare and no EXPOSE.
# A container here is a way to run the server with a pinned toolchain, not a
# network endpoint — `docker run -i` attaches a pipe, and a client speaks
# JSON-RPC over it. See wiki/environments/docker.md.
ENTRYPOINT ["node", "src/index.js"]
