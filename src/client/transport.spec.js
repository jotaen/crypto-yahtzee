const assert = require("assert")
const { noop } = require("../lib/util")
const { isHexString } = require("../crypto/hash")
const { Transport } = require("./transport")

class CallSpy {
  constructor() { this.calls = [] }
  invoke(data) { this.calls.push(data) }
}

describe("[Transport] Receiving messages", () => {
  it("passes incoming data to processor", () => {
    const processor = new CallSpy()
    const t = new Transport(noop, d => processor.invoke(d))

    t.onMessage(`{ "type": "data", "uuid": "1", "data": { "foo": true } }`)
    assert.deepStrictEqual(processor.calls[0], { foo: true })
  })

  it("acknowledges incoming messages via their uuid", () => {
    const socket = new CallSpy()
    const t = new Transport(d => socket.invoke(d), noop)
    const uuid = "172y8ughasf"

    t.onMessage(`{ "type": "data", "uuid": "${uuid}", "data": { "foo": true } }`)
    assert.strictEqual(socket.calls[0], JSON.stringify({ type: "ack", uuid: "172y8ughasf" }))
  })

  it("doesn’t pass on duplicate messages multiple times (determined by uuid)", () => {
    const socket = new CallSpy()
    const processor = new CallSpy()
    const t = new Transport(d => socket.invoke(d), d => processor.invoke(d))

    t.onMessage(`{ "type": "data", "uuid": "9871236", "data": { "foo": true } }`)
    t.onMessage(`{ "type": "data", "uuid": "9871236", "data": { "foo": true } }`)
    assert.strictEqual(processor.calls.length, 1)
    assert.strictEqual(socket.calls.length, 1)
  })
})

describe("[Transport] Sending messages", () => {
  it("sends out data", () => {
    const socket = new CallSpy()
    const t = new Transport(d => socket.invoke(d), noop)
    const data = { foo: 6 }

    t.sendData(data)
    assert.deepStrictEqual(JSON.parse(socket.calls[0]).type, "data")
    assert.deepStrictEqual(JSON.parse(socket.calls[0]).data, data)
    assert.strictEqual(isHexString(32)(JSON.parse(socket.calls[0]).uuid), true)
  })

  it("retries sending messages when they don’t get acknowledged", (done) => {
    const socket = new CallSpy()
    const t = new Transport(d => socket.invoke(d), noop, { retryIntervalMs: 1 })
    t.sendData({ foo: 6 })
    setTimeout(() => {
      const msg = JSON.parse(socket.calls[0])
      t.onMessage(`{ "type": "ack", "uuid": "${msg.uuid}" }`)
      const retriesUntilSuccess = socket.calls.length
      setTimeout(() => {
        assert.strictEqual(socket.calls.length, retriesUntilSuccess)
        done()
      }, 5)
    }, 5)
  })
})
