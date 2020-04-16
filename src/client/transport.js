const { randomBytes } = require("../crypto/rsa")
const { noop } = require("../lib/util")

class Transport {
  constructor(send, processData, retryFn = noop) {
    this._send = send
    this._processData = processData
    this._retryFn = retryFn
    this._acknowledged = new Set()
    this._processed = new Set()
    this._buffer = new Map()
  }

  sendData(recipient, data) {
    this._deliverMessage({
      type: "data",
      recipient: recipient,
      uuid: randomBytes("hex", 16),
      data: data,
    })
  }

  onMessage(blob) {
    const message = JSON.parse(blob)
    if (message.type === "ack") {
      this._acknowledged.add(message.uuid)
    } else if (message.type === "data") {
      this._send(JSON.stringify({ type: "ack", uuid: message.uuid }))
      if (this._processed.has(message.uuid)) {
        return
      }
      this._processed.add(message.uuid)
      if (!this._processData(message.data)) {
        this._buffer.set(message.uuid, message.data)
      }
    }
  }

  retryAllPending() {
    this._buffer.forEach((data, uuid) => {
      if (this._processData(data)) {
        this._buffer.delete(uuid)
      }
    })
  }

  _deliverMessage(message) {
    this._send(JSON.stringify(message))
    if (!this._acknowledged.has(message.uuid)) {
      this._retryFn(() => this._deliverMessage(message))
    }
  }
}

module.exports = { Transport }
