const WebSocket = require("ws")

const PORT = process.env.PORT || 8080

const server = new WebSocket.Server({ port: PORT })

const clients = new Map()

console.log(`Broker listening on ${PORT}`)

server.on("connection", (client, request) => {
  const publicKey = request.searchParams.get("publicKey")
  clients.set(publicKey, client)

  console.log(`Connected ${publicKey}`)

  client.onmessage(data => {
    const message = JSON.parse(data)
    const recipient = clients.get(message.recipient)
    if (!recipient || !recipient.readyState === WebSocket.OPEN) {
      return
    }
    console.log(`Received message ${sender} > ${recipient}`)
    recipient.send(JSON.stringify(message.data))
  })

  client.onclose(() => {
    clients.delete(publicKey)
    console.log(`Disconnected ${publicKey}`)
  })
})
