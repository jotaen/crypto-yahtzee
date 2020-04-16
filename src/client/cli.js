const WebSocket = require("ws")
const { Transport } = require("./transport")
const { Game } = require("../game")

const { ALICE, BOB } = require("../lib/rsa-testdata.json")

const ownerKeyPair = {} // TODO read from FS
const otherPlayersPublicKeys = [] // TODO read from FS

const transport = new Transport(
  ownerKeyPair.public,
  otherPlayersPublicKeys,
  fn => setTimeout(fn, 200)
)

const game = new Game(ALICE, [BOB.public], {
  onUpdate: () => {}, // TODO wire to CLI
  onTurn: () => {}, // TODO wire to CLI
  onPopulateBlock: block => transport.fanOut(block),
})
transport.onReceiveMessage(block => game.receiveBlock(block))

const connect = () => {
  const websocket = new WebSocket("ws://localhost:8080")
  transport.wireUp(websocket)
  websocket.onclose(() => {
    transport.wireUp(null)
    connect()
  })
}
