# 🔑🎲 Crypto Yahtzee

The dice game [Yahtzee](https://en.wikipedia.org/wiki/Yahtzee) as peer-to-peer implementation served on your command line.

## Play!

The game is played on the command line. Run:

```
docker run --rm -it jotaen/crypto-yahtzee
```

This will pull the latest version as docker container and start the game right away. You should be able to start playing without further ado. You need Docker (> 19.03.8).

### Options:

- `-v ~/some-folder:/data`: You can preserve data like keys in order to reuse them. The `/data` folder contains the following subfolders:
  - `/keys`: Your own RSA key pair are located here (named `yahtzee` and `yahtzee.pub`). If no keys are provided, the game autogenerates them and stores them here.
  - `/players`: All registered players’ public keys are stored here.
- `-e "BROKER=ws://your-own-broker.com"`: You can set a custom websocket URL as environment variable (`BROKER`) for connection to your own broker. If not specified, the game will automatically connect to a message broker that I host.

## Broker

This implementation makes use of a message broker that dispatches messages between players. That makes the setup easier compared to a true peer-to-peer connection, due to firewall constraints. The broker doesn’t contain any game logic, though, it only passes on the data as is.

For your convenience, I currently run a broker online that the game automatically will connect to. You can also deploy your own – find the sources in the [/broker](broker/) directory.
