const assert = require("assert")
const { Game } = require("./game")
const { random } = require("./crypto/dicecup")

const { ALICE, BOB } = require("./crypto/rsa-testdata.json")

const hashes = rs => rs.map(r => r.value.hash)
const values = rs => rs.map(r => r.value.value)

const defaultCallbacks = buffer => ({
	onRoll: arity => Array.from(Array(arity)).map(() => random()),
	onPopulateBlock: block => buffer.push(block),
})

describe("[Game] Flow", () => {
	it("1. Initialisation (determine turn order through rolling)", () => {
		const buffer = []

		const alice = new Game(ALICE, [BOB.public], defaultCallbacks(buffer))
		const bob = new Game(BOB, [ALICE.public], defaultCallbacks(buffer))

		assert.strictEqual(buffer.length, 2)
		bob.receiveBlock(buffer.shift())
		alice.receiveBlock(buffer.shift())

		assert.strictEqual(buffer.length, 2)
		alice.receiveBlock(buffer.shift())
		bob.receiveBlock(buffer.shift())
	})
})
