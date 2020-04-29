module.exports = {
  BROKER_URL: process.env.BROKER || "ws://crypto-yahtzee-broker.herokuapp.com",
  OWNER_KEY_PATH: "/data/keys/yahtzee",
  PLAYERS_FOLDER: "/data/players"
}
