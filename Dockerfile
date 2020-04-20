FROM node:12.14-alpine

# Folder for user’s keys
RUN mkdir -p /data/keys

# Set editor for CLI (entering keys)
ENV EDITOR vi

WORKDIR /app

COPY . ./
RUN npm i

ENTRYPOINT ["./run"]
CMD ["cli"]
