const { randomBytes } = require("../crypto/rsa")
const { noop } = require("../lib/util")

class Transport {
  constructor(ownerKeyO, otherParticipantsKeyO, retryFn = noop) {
    this._sender = ownerKeyO.finger
    this._recipients = otherParticipantsKeyO.map(k => k.finger)
    this._retryFn = retryFn
    this._processData = noop
    this._send = null
    this._acknowledged = new Set() // uuids
    this._processed = new Set() // uuids
    this._incomingBuffer = new Map() // uuid:message
    this._outgoingBuffer = new Map() // uuid:message
    this._handleIncoming = this._handleIncoming.bind(this)
  }

  sender() {
    return this._sender
  }

  fanOut(data) {
    this._recipients.forEach(r => {
      this._deliverOutgoing({
        type: "data",
        recipient: r,
        uuid: randomBytes("hex", 16),
        data: data,
      })
    })
  }

  onReceiveMessage(handlerFn) {
    this._processData = handlerFn
  }

  wireUp(websocket) {
    if (websocket) {
      websocket.on("message", messageTxt => {
        try {
          const message = JSON.parse(messageTxt)
          this._handleIncoming(message)
        }
        catch (e) { console.error("Websocket error (receiving):", e) }
      })
      this._send = message => {
        try { websocket.send(JSON.stringify(message)) }
        catch (e) { console.error("Websocket error (sending):", e) }
      }
      this._flushOutgoingBuffer()
    } else {
      this._send = null
    }
  }

  _handleIncoming(message) {
    if (message.type === "ack") {
      this._acknowledged.add(message.uuid)
    } else if (message.type === "data") {
      this._send({ type: "ack", recipient: message.data.author, uuid: message.uuid })
      if (this._processed.has(message.uuid)) {
        return
      }
      this._processed.add(message.uuid)
      if (this._processData(message.data)) {
        // flush buffer, because maybe those messages can be processed now
        this._flushIncomingBuffer()
      } else {
        this._incomingBuffer.set(message.uuid, message)
      }
    }
  }

  _flushIncomingBuffer() {
    this._incomingBuffer.forEach(message => {
      if (this._processData(message.data)) {
        this._incomingBuffer.delete(message.uuid)
      }
    })
  }

  _flushOutgoingBuffer() {
    this._outgoingBuffer.forEach(message => {
      this._deliverOutgoing(message)
    })
  }

  _deliverOutgoing(message) {
    if (this._send === null) {
      this._outgoingBuffer.set(message.uuid, message)
      return
    }
    this._send(message)
    if (!this._acknowledged.has(message.uuid)) {
      this._retryFn(() => this._deliverOutgoing(message))
    }
  }
}

module.exports = { Transport }
