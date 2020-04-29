FROM node:12.16.2-alpine

# Install bash for `run` script
RUN apk add --update bash && rm -rf /var/cache/apk/*

# Set editor for CLI (entering keys)
ENV EDITOR vi

# Folder for user’s keys
RUN mkdir -p /data/keys
RUN mkdir -p /data/players

# Configure environment
WORKDIR /app
ENTRYPOINT ["./run"]
CMD ["cli"]

# Install dependencies
COPY package-lock.json package.json ./
RUN npm ci

# Copy scripts and sources
COPY run .
COPY src src
