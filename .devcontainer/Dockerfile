FROM node:24-bookworm

# Enable corepack for pnpm support
RUN corepack enable && corepack enable pnpm

# Set pnpm home environment variable
ENV PNPM_HOME=/usr/local/share/pnpm

# Install sudo for any commands that might need it
RUN apt-get update && apt-get install -y sudo && rm -rf /var/lib/apt/lists/*

# Set up pnpm cache directory with proper permissions for root
RUN mkdir -p /usr/local/share/pnpm

# Set working directory
WORKDIR /workspaces
