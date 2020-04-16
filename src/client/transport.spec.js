const assert = require("assert")
const { noop } = require("../lib/util")
const { isHexString } = require("../crypto/hash")
const { Transport } = require("./transport")
const { ALICE, BOB, CHRIS } = require("../lib/rsa-testdata.json")

class FakeSocket {
  constructor() {
    this.sent = []
    this._onmessage = noop
  }
  onmessage(fn) { this._onmessage = fn }
  emit(jsonData) { this._onmessage({ data: JSON.stringify(jsonData)}) }
  send(stringifiedMessage) { this.sent.push(JSON.parse(stringifiedMessage)) }
}

class FakeProcessor {
  constructor() { this.processed = [] }
  return(value) {
    return data => {
      this.processed.push(data)
      return value
    }
  }
}

describe("[Transport] Receiving messages", () => {
  it("passes incoming data to processor", () => {
    const processor = new FakeProcessor()
    const socket = new FakeSocket()
    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public])
    t.wireUp(socket)
    t.onReceiveMessage(processor.return(true))

    socket.emit({ type: "data", uuid: "1", data: { "foo": true } })
    assert.deepStrictEqual(processor.processed[0], { foo: true })
  })

  it("acknowledges incoming messages via their uuid", () => {
    const processor = new FakeProcessor()
    const socket = new FakeSocket()
    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public])
    t.wireUp(socket)
    t.onReceiveMessage(processor.return(true))
    const uuid = "172y8ughasf"

    socket.emit({ type: "data", uuid: uuid, data: { "foo": true } })
    assert.deepStrictEqual(socket.sent[0], {
      type: "ack",
      uuid: uuid
    })
  })

  it("doesn’t pass on duplicate messages multiple times (determined by uuid)", () => {
    const processor = new FakeProcessor()
    const socket = new FakeSocket()
    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public])
    t.wireUp(socket)
    t.onReceiveMessage(processor.return(true))
    const uuid = "oa7sdyfu12"

    socket.emit({ type: "data", uuid: uuid, data: { "foo": true } })
    socket.emit({ type: "data", uuid: uuid, data: { "foo": true } })
    assert.strictEqual(processor.processed.length, 1)
    // sends ack every time though, maybe the sender didn’t receive the first one:
    assert.deepStrictEqual(socket.sent.map(m => m.uuid), [uuid, uuid])
  })

  it("acknowledges messages even if processor doesn’t accept them", () => {
    const processor = new FakeProcessor()
    const socket = new FakeSocket()
    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public])
    t.wireUp(socket)
    t.onReceiveMessage(processor.return(false))

    socket.emit({ type: "data", uuid: "9871236", data: { "foo": true } })
    // ack gets (optimistically) send back anyway:
    assert.strictEqual(socket.sent.length, 1)
  })

  it("stores unprocessable messages so that they can be retried later", () => {
    const processor = new FakeProcessor()
    const socket = new FakeSocket()
    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public])
    t.wireUp(socket)
    t.onReceiveMessage(processor.return(false))

    socket.emit({ type: "data", uuid: "3difuyg187", data: { "foo": 1 } })
    socket.emit({ type: "data", uuid: "o87df8q982", data: { "foo": 2 } })
    // this will process the new message and flush the two old ones:
    t.onReceiveMessage(processor.return(true))
    socket.emit({ type: "data", uuid: "19g83yhas3", data: { "foo": 3 } })
    socket.emit({ type: "data", uuid: "uquwj81ins", data: { "foo": 4 } })

    assert.deepStrictEqual(processor.processed.map(d => d.foo), [
      1, 2, 3, 1, 2, 4
    ])
  })
})

describe("[Transport] Sending messages", () => {
  it("sends out data", () => {
    const socket = new FakeSocket()
    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public])
    t.wireUp(socket)
    const data = { foo: 123 }

    t.fanOut(data)

    assert.deepStrictEqual(socket.sent[0].type, "data")
    assert.deepStrictEqual(socket.sent[0].sender, ALICE.finger)
    assert.deepStrictEqual(socket.sent[0].recipient, BOB.finger)
    assert.deepStrictEqual(socket.sent[0].data, data)
    assert.strictEqual(isHexString(32)(socket.sent[0].uuid), true)
    
    assert.deepStrictEqual(socket.sent[1].type, "data")
    assert.deepStrictEqual(socket.sent[1].sender, ALICE.finger)
    assert.deepStrictEqual(socket.sent[1].recipient, CHRIS.finger)
    assert.deepStrictEqual(socket.sent[1].data, data)
    assert.strictEqual(isHexString(32)(socket.sent[1].uuid), true)

    assert.notStrictEqual(socket.sent[0].uuid, socket.sent[1].uuid)
  })

  it("retries sending messages when they don’t get acknowledged", () => {
    const socket = new FakeSocket()

    let retries = 0
    const retryFn = fn => {
      retries++
      if (retries > 5) {
        socket.sent.forEach(m => {
          socket.emit({ type: "ack", uuid: m.uuid })
        })
      }
      fn()
    }

    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public], retryFn)
    t.wireUp(socket)

    t.fanOut({ foo: 6 })
    assert.strictEqual(socket.sent.length, 9)
  })

  it("suspends sending while disconnected, but buffers and resumes afterwards", () => {
    const socket = new FakeSocket()
    const t = new Transport(ALICE.public, [BOB.public, CHRIS.public])

    t.fanOut({ foo: 123 })
    t.fanOut({ foo: true })
    assert.deepStrictEqual(socket.sent.length, 0)
    
    t.wireUp(socket)
    assert.deepStrictEqual(socket.sent.length, 4)
    
    t.fanOut({ foo: true })
    // buffer was cleared after last wiring
    assert.deepStrictEqual(socket.sent.length, 6)
    
    t.wireUp(null)
    t.fanOut({ foo: 123 })
    assert.deepStrictEqual(socket.sent.length, 6)
  })
})
