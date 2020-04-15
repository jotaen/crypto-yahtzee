const WebSocket = require("ws")

const server = new WebSocket.Server({ port: 8080 })

const clients = new Map()

server.on("connection", (client, request) => {
  const publicKey = request.searchParams.get("publicKey")
  clients.set(publicKey, client)

  client.on("message", data => {
    const message = JSON.parse(data)
    const recipient = clients.get(message.recipient)
    if (!recipient || !recipient.readyState === WebSocket.OPEN) {
      return
    }
    recipient.send(JSON.stringify(message.data))
  })

  client.on("close", () => {
    clients.delete(publicKey)
  })
})
