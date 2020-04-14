const assert = require("assert")
const { Game } = require("./game")
const { random } = require("./crypto/dicecup")
const { Blockchain } = require("./crypto/blockchain")

const { ALICE, BOB, CHRIS } = require("./crypto/rsa-testdata.json")

const hashes = rs => rs.map(r => r.hash)
const seeds = rs => rs.map(r => r.seed)
const values = rs => rs.map(r => r.value)

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

describe("[Game] Edge cases", () => {
	it("Only accepts blocks where player is author", () => {
		const alice = new Game(ALICE, [BOB.public, CHRIS.public], defaultCallbacks([]))
		const bobBlockchain = new Blockchain(BOB, [ALICE.public, CHRIS.public])

		const rs = [random(), random(), random()]
		bobBlockchain.commitOwnBlock(
			null,
			{ type: "DICECUP_HASHES", player: CHRIS.public, seeds: seeds(rs), hashes: hashes(rs) }
		)

		assert.throws(
			() => alice.receiveBlock(bobBlockchain.head()[0]),
			e => e === "AUTHORISATION_FAILURE"
		)
	})
})
