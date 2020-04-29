const WebSocket = require("ws")
const { Transport } = require("./transport")
const { Game } = require("../game")
const { mainMenu, waiting, goodBye } = require("./menu")
const { renderScoreCards, handleTurn, printTable } = require("./game")
const { generateKeyPair, toKeyO } = require("../crypto/rsa")
const fileSystem = require("fs").promises
const { BROKER_URL, OWNER_KEY_PATH, TRANSPORT_RETRY_INTERVAL_MS } = require("./config")

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

const readOrCreateOwnerKeys = () => fileSystem.stat(OWNER_KEY_PATH)
  .catch(() => generateKeyPair()
    .then(keys => Promise.all([
      fileSystem.writeFile(OWNER_KEY_PATH + ".pub", keys.publicKey),
      fileSystem.writeFile(OWNER_KEY_PATH, keys.privateKey),
    ])))
  .then(() => Promise.all([
    fileSystem.readFile(OWNER_KEY_PATH + ".pub"),
    fileSystem.readFile(OWNER_KEY_PATH),
  ]))
  .then(keys => toKeyO(keys[0].toString(), keys[1].toString()))

readOrCreateOwnerKeys().then(ownerKeys => {
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
