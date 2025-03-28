FROM postgres:latest

# Install Node.js
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Make the initialization scripts executable
RUN mkdir -p /docker-entrypoint-initdb.d

# Default PostgreSQL port
EXPOSE 5432 