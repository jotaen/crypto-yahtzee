# 🔑🎲 Crypto Yahtzee

The dice game [Yahtzee](https://en.wikipedia.org/wiki/Yahtzee) as peer-to-peer implementation served on your command line.

## Get started

You need Docker (> 19.03.8). Run `docker run jotaen/crypto-yahtzee` on your command line. This will pull the latest version as docker container and start the game right away. You should be able to start playing without further ado.

### Options:

- The game will automatically generate RSA keys for you. You can provide your own by mounting a volume to `/data/keys` containing the public and private key file (named `yahtzee`).
- The game will automatically connect to the default message broker. You can pass a websocket URL as argument to the entrypoint to override that URL.
