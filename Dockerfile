FROM node:12.14

# vim is needed for pasting public keys into the CLI
RUN apt-get update && apt-get install -y vim

# Folder for user’s keys
RUN mkdir -p /data/keys

WORKDIR /app
