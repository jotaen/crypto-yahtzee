const WebSocket = require("ws")
const { Transport } = require("./transport")
const { Game } = require("../game")
const { mainMenu } = require("./menu")
const { renderScoreCards, handleTurn, printTable, printGoodBye } = require("./game")
const { generateKeyPair, toKeyO } = require("../crypto/rsa")
const fileSystem = require("fs").promises
const { BROKER_URL, OWNER_KEY_PATH } = require("./config")

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
  return mainMenu(ownerKeys).then(otherPlayersPublicKeys => {
    const transport = new Transport(
      ownerKeys,
      otherPlayersPublicKeys,
      fn => setTimeout(fn, 200)
    )
    establishSocket(transport)
    const game = new Game(ownerKeys, otherPlayersPublicKeys, {
      onUpdate: renderScoreCards(ownerKeys.finger),
      onTurn: handleTurn,
      onViewOthers: printTable,
      onPopulateBlock: block => transport.fanOut(block),
      onGameEnd: printGoodBye,
    })
    transport.onReceiveMessage(block => game.receiveBlock(block))
  })
})
.catch(console.log)
