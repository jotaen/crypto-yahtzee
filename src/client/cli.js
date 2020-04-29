const WebSocket = require("ws")
const { Transport } = require("./transport")
const { Game } = require("../game")
const { mainMenu, waiting, goodBye } = require("./menu")
const { renderScoreCards, handleTurn, printTable } = require("./game")
const { generateKeyPair, toKeyO } = require("../crypto/rsa")
const fileSystem = require("fs").promises
const { BROKER_URL, DATA_DIRECTORY, OWNER_KEY_FOLDER, PLAYERS_FOLDER, TRANSPORT_RETRY_INTERVAL_MS } = require("./config")

const establishSocket = transport => {
  try {
    const websocket = new WebSocket(BROKER_URL + "?id=" + transport.sender())
    websocket.on("open", () => {
      transport.wireUp(websocket)
    })
    websocket.on("close", () => {
      transport.wireUp(null)
      establishSocket(transport)
    })
    websocket.on("error", error => {
      if (error.code === "ECONNREFUSED") {
        websocket.close()
      }
    })
  } catch(e) {
    console.error(e)
    establishSocket(transport)
  }
}

const ensureDataFolderStructure = () => Promise.all([
  fileSystem.mkdir(DATA_DIRECTORY + OWNER_KEY_FOLDER),
  fileSystem.mkdir(DATA_DIRECTORY + PLAYERS_FOLDER),
]).catch(e => {
  if (e.code !== "EEXIST") throw e
})

const readOrCreateOwnerKeys = () => {
  const privateKeyFile = DATA_DIRECTORY + OWNER_KEY_FOLDER + "yahtzee"
  const publicKeyFile = privateKeyFile + ".pub"
  return fileSystem.stat(privateKeyFile)
    .catch(() => generateKeyPair()
      .then(keys => Promise.all([
        fileSystem.writeFile(publicKeyFile, keys.publicKey),
        fileSystem.writeFile(privateKeyFile, keys.privateKey),
      ])))
    .then(() => Promise.all([
      fileSystem.readFile(publicKeyFile),
      fileSystem.readFile(privateKeyFile),
    ]))
    .then(keys => toKeyO(keys[0].toString(), keys[1].toString()))
}

ensureDataFolderStructure().then(() => readOrCreateOwnerKeys()).then(ownerKeys => {
  return mainMenu(ownerKeys).then(otherPlayers => {
    waiting()
    const otherPlayerKeys = otherPlayers.map(p => p.key)
    const playerNamesByFinger = otherPlayers.reduce((res, p) => {
      res[p.key.finger] = p.name
      return res
    }, { [ownerKeys.finger]: " YOU " })
    const transport = new Transport(
      ownerKeys,
      otherPlayerKeys.length === 0 ? [ownerKeys] : otherPlayerKeys, // Trick to allow playing against oneself,
      fn => setTimeout(fn, TRANSPORT_RETRY_INTERVAL_MS),
    )
    establishSocket(transport)
    const game = new Game(ownerKeys, otherPlayerKeys, {
      onUpdate: renderScoreCards(playerNamesByFinger),
      onTurn: handleTurn(playerNamesByFinger),
      onViewOthers: printTable(playerNamesByFinger, false),
      onPopulateBlock: block => transport.fanOut(block),
      onGameEnd: goodBye,
    })
    transport.onReceiveMessage(block => game.receiveBlock(block))
  })
})
.catch(console.log)
