FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine 
# to understand why libc6-compat might be needed
RUN apk add --no-cache libc6-compat python3 make g++ wget

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create directories for Whisper and FFmpeg binaries
RUN mkdir -p whisper bin

# Clone and build Whisper.cpp from source
RUN apk add --no-cache git cmake make g++ && \
    git clone https://github.com/ggml-org/whisper.cpp.git /tmp/whisper-src && \
    cd /tmp/whisper-src && \
    make -j$(nproc) && \
    mkdir -p /app/whisper && \
    cp build/bin/main /app/whisper/whisper && \
    chmod +x /app/whisper/whisper && \
    cd /app && \
    rm -rf /tmp/whisper-src

# Download Whisper small model
RUN wget -O ./whisper/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin

# Download and install FFmpeg static build
RUN wget -O /tmp/ffmpeg-git-amd64-static.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-git-essentials-amd64-static.tar.xz && \
    tar xvf /tmp/ffmpeg-git-amd64-static.tar.xz && \
    mv ffmpeg-git-*-amd64-static/ffmpeg ./bin/ && \
    chmod +x ./bin/ffmpeg && \
    rm -rf ffmpeg-git-*-amd64-static && \
    rm /tmp/ffmpeg-git-amd64-static.tar.xz

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Whisper and FFmpeg binaries to the correct locations
COPY --from=builder --chown=nextjs:nodejs /app/whisper ./whisper
COPY --from=builder --chown=nextjs:nodejs /app/bin ./bin

# Set proper permissions
RUN chmod +x ./whisper/whisper ./bin/ffmpeg

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]