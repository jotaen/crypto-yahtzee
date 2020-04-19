# 🔑🎲 Crypto Yahtzee

The dice game [Yahtzee](https://en.wikipedia.org/wiki/Yahtzee) as peer-to-peer implementation served on your command line.

## Get started

You need Docker (> 19.03.8). Run `docker run jotaen/crypto-yahtzee` on your command line. This will pull the latest version as docker container and start the game right away. You should be able to start playing without further ado.

### Options:

- `-v /your/computer/keys:/data/keys`: You can provide your own by mounting a volume to `/data/keys` containing the public and private RSA key files (named `yahtzee` and `yahtzee.pub`). If not specified, the game will automatically generate RSA keys for you on startup.
- `-e "BROKER=ws://your-own-broker.com"`: You can set a custom websocket URL as environment variable (`BROKER`) for connection to your own broker. If not specified, the game will automatically connect to a message broker that I host.
