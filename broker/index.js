const WebSocket = require("ws")
const url = require("url")
const querystring = require("querystring")

const PORT = process.env.PORT || 8080
const server = new WebSocket.Server({ port: PORT })
const clients = new Map()

console.log(`Broker listening on ${PORT}`)

server.on("connection", (client, request) => {
  const clientId = querystring.parse(url.parse(request.url).query).id
  if (!clientId || String(clientId).length < 128 || clients.has(clientId)) {
    client.close()
    return
  }
  clients.set(clientId, client)
  console.log(`Connected ${clientId}`)

  client.on("message", messageTxt => {
    try {
      const recipientId = JSON.parse(messageTxt).recipient
      const recipient = clients.get(recipientId)
      if (!recipient || !recipient.readyState === WebSocket.OPEN) {
        return
      }
      recipient.send(messageTxt)
    } catch(e) {}
  })

  client.on("close", () => {
    clients.delete(clientId)
    console.log(`Disconnected '${clientId}'`)
  })
})
