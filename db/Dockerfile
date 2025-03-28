FROM postgres:latest

# Install Node.js
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Make the initialization scripts executable
RUN mkdir -p /docker-entrypoint-initdb.d

# Create a directory for post-initialization scripts
RUN mkdir -p /post-init-scripts

# Copy post-initialization script
COPY post-init.sh /post-init.sh
RUN chmod +x /post-init.sh

# Default PostgreSQL port
EXPOSE 5432

# Start PostgreSQL and then run the post-initialization script
CMD bash -c "/usr/local/bin/docker-entrypoint.sh postgres & \
    until pg_isready -U postgres; do sleep 1; done && \
    echo 'PostgreSQL is ready, running post-initialization scripts' && \
    bash /post-init.sh" 