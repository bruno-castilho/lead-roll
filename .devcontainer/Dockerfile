FROM mcr.microsoft.com/devcontainers/typescript-node

WORKDIR /app

RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

RUN apt-get update && apt-get install -y \
    docker-ce-cli \
    docker-buildx-plugin \
    docker-compose-plugin \
    iputils-ping \
    curl \
    unzip \
    postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code