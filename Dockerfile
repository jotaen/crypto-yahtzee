FROM node:12.16.2-alpine

# Install bash for `run` script
RUN apk add --update bash && rm -rf /var/cache/apk/*

# Folder for user’s keys
RUN mkdir -p /data/keys

# Set editor for CLI (entering keys)
ENV EDITOR vi

WORKDIR /app

COPY . ./
RUN npm i

ENTRYPOINT ["./run"]
CMD ["cli"]
