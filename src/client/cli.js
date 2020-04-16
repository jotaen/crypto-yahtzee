const WebSocket = require("ws")
const Transport = require("./transport")
const Game = require("../game")

const websocket = new WebSocket("ws://localhost:8080")
const transport = new Transport(
  data => websocket.send(data),

)
websocket.on("message", data => { transport.onMessage(data) })

websocket.on("open", () => {

})
