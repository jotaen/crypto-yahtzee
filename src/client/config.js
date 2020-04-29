module.exports = Object.freeze({
  BROKER_URL: process.env.BROKER || "ws://crypto-yahtzee-broker.herokuapp.com",
  DATA_DIRECTORY: "/data/",
  OWNER_KEY_FOLDER: "keys/",
  PLAYERS_FOLDER: "players/",
  TRANSPORT_RETRY_INTERVAL_MS: 500,
})
