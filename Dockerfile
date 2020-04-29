FROM node:12.16.2-alpine

# Install bash for `run` script
RUN apk add --update bash && rm -rf /var/cache/apk/*

# Set editor for CLI (entering keys)
ENV EDITOR vi

# Configure app-specific environment
WORKDIR /app
ENTRYPOINT ["./run"]
CMD ["cli"]

# Folder for persisting game data
RUN mkdir /data

# Install dependencies
COPY package-lock.json package.json ./
RUN npm ci

# Copy scripts and sources
COPY run .
COPY src src
