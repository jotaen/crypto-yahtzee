const { randomBytes } = require("../crypto/rsa")

class Transport {
  constructor(send, processData, config) {
    this._send = send
    this._processData = processData
    this._config = {
      retryIntervalMs: 50,
      ...config
    }
    this._acknowledged = new Set()
  }

  sendData(data) {
    this._deliverMessage({
      type: "data",
      uuid: randomBytes("hex", 16),
      data: data,
    })
  }

  _deliverMessage(message) {
    this._send(JSON.stringify(message))
    setTimeout(() => {
      if (!this._acknowledged.has(message.uuid)) {
        this._deliverMessage(message)
      }
    }, this._config.retryIntervalMs);
  }

  onMessage(blob) {
    const message = JSON.parse(blob)
    if (message.type === "ack") {
      this._acknowledged.add(message.uuid)
    } else if (message.type === "data") {
      if (this._acknowledged.has(message.uuid)) {
        return
      }
      this._processData(message.data)
      this._acknowledged.add(message.uuid)
      this._send(JSON.stringify({ type: "ack", uuid: message.uuid }))
    }
  }
  
}

module.exports = { Transport }
