const WebSocket = require("ws")
const { Transport } = require("./transport")
const { Game } = require("../game")
const { generateKeyPair, keyObjects } = require("../crypto/rsa")
const fileSystem = require("fs").promises

const KEY = {
  dir: "/data/keys",
  file: "yahtzee",
}

// const transport = new Transport(
//   ownerKeyPair.public,
//   otherPlayersPublicKeys,
//   fn => setTimeout(fn, 200)
// )

// const game = new Game(ALICE, [BOB.public], {
//   onUpdate: () => {}, // TODO wire to CLI
//   onTurn: () => {}, // TODO wire to CLI
//   onPopulateBlock: block => transport.fanOut(block),
// })
// transport.onReceiveMessage(block => game.receiveBlock(block))

const connect = () => {
  const websocket = new WebSocket("ws://localhost:8080")
  transport.wireUp(websocket)
  websocket.onclose(() => {
    transport.wireUp(null)
    connect()
  })
}

const ensureOwnKeys = () => fileSystem.stat(KEY.dir + KEY.file)
  .catch(() => generateKeyPair()
    .then(keys => Promise.all([
      fileSystem.writeFile(KEY.dir + KEY.file + ".pub", keys.publicKey),
      fileSystem.writeFile(KEY.dir + KEY.file, keys.privateKey),
    ])))
  .then(() => Promise.all([
    fileSystem.readFile(KEY.dir + KEY.file + ".pub"),
    fileSystem.readFile(KEY.dir + KEY.file),
  ]))
  .then(keys => keyObjects(keys[0].toString(), keys[1].toString()))

Promise.all([
  // connect(),
  ensureOwnKeys(),
]).then(keys => {
  console.log(keys)
}).catch(console.log)
