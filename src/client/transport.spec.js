const assert = require("assert")
const { noop } = require("../lib/util")
const { isHexString } = require("../crypto/hash")
const { Transport } = require("./transport")

class CallSpy {
  constructor() { this.calls = [] }
  return(value) {
    return data => {
      this.calls.push(data)
      return value
    }
  }
}

describe("[Transport] Receiving messages", () => {
  it("passes incoming data to processor", () => {
    const processor = new CallSpy()
    const t = new Transport(noop, processor.return(true))

    t.onMessage(`{ "type": "data", "uuid": "1", "data": { "foo": true } }`)
    assert.deepStrictEqual(processor.calls[0], { foo: true })
  })

  it("acknowledges incoming messages via their uuid", () => {
    const socket = new CallSpy()
    const t = new Transport(socket.return(), noop)
    const uuid = "172y8ughasf"

    t.onMessage(`{ "type": "data", "uuid": "${uuid}", "data": { "foo": true } }`)
    assert.strictEqual(socket.calls[0], JSON.stringify({ type: "ack", uuid: "172y8ughasf" }))
  })

  it("doesn’t pass on duplicate messages multiple times (determined by uuid)", () => {
    const socket = new CallSpy()
    const processor = new CallSpy()
    const t = new Transport(socket.return(), processor.return(true))

    t.onMessage(`{ "type": "data", "uuid": "9871236", "data": { "foo": true } }`)
    t.onMessage(`{ "type": "data", "uuid": "9871236", "data": { "foo": true } }`)
    assert.strictEqual(processor.calls.length, 1)
    assert.strictEqual(socket.calls.length, 2) // sends ack every time though!
  })

  it("acknowledges messages even if processor doesn’t accept them", () => {
    const socket = new CallSpy()
    const processor = new CallSpy()
    const t = new Transport(socket.return(), processor.return(false))
    t.onMessage(`{ "type": "data", "uuid": "9871236", "data": { "foo": true } }`)
    assert.strictEqual(socket.calls.length, 1)
  })

  it("stores unprocessable messages so that they can be retried later", () => {
    const spyControl = { returnVal: false }
    const processor = new CallSpy()
    const socket = new CallSpy()
    const t = new Transport(socket.return(), data => {
      return processor.return(spyControl.returnVal)(data)
    })

    t.onMessage(`{ "type": "data", "uuid": "3difuyg187", "data": { "baz": [] } }`)
    t.onMessage(`{ "type": "data", "uuid": "o87df8q982", "data": { "foo": true } }`)
    assert.strictEqual(processor.calls.length, 2)
    t.retryAllPending()
    assert.strictEqual(processor.calls.length, 4)

    spyControl.returnVal = true
    t.onMessage(`{ "type": "data", "uuid": "19g83yhas3", "data": { "bar": 123 } }`)
    assert.strictEqual(processor.calls.length, 5)
    t.retryAllPending()
    assert.strictEqual(processor.calls.length, 7)

    // Buffer is cleared after successful delivery
    t.retryAllPending()
    assert.strictEqual(processor.calls.length, 7)
  })
})

describe("[Transport] Sending messages", () => {
  it("sends out data", () => {
    const socket = new CallSpy()
    const t = new Transport(socket.return(), noop)
    const data = { foo: 6 }

    t.sendData("ia79s6dtfiausdf", data)
    assert.deepStrictEqual(JSON.parse(socket.calls[0]).type, "data")
    assert.deepStrictEqual(JSON.parse(socket.calls[0]).recipient, "ia79s6dtfiausdf")
    assert.deepStrictEqual(JSON.parse(socket.calls[0]).data, data)
    assert.strictEqual(isHexString(32)(JSON.parse(socket.calls[0]).uuid), true)
    t.onMessage(`{ "type": "ack", "uuid": "${JSON.parse(socket.calls[0]).uuid}" }`)
  })

  it("retries sending messages when they don’t get acknowledged", (done) => {
    const socket = new CallSpy()
    const t = new Transport(socket.return(), noop, { retryIntervalMs: 1 })
    t.sendData("o8s97ftguyasdf", { foo: 6 })
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
