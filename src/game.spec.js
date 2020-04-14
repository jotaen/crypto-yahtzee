const assert = require("assert")
const { Game } = require("./game")
const { random } = require("./crypto/dicecup")
const { Blockchain } = require("./crypto/blockchain")
const { Broker } = require("./lib/fakebroker")

const { ALICE, BOB, CHRIS } = require("./crypto/rsa-testdata.json")

const hashes = rs => rs.map(r => r.hash)
const seeds = rs => rs.map(r => r.seed)
const values = rs => rs.map(r => r.value)

const defaultCallbacks = broker => ({
	onRoll: arity => Array.from(Array(arity)).map(() => random()),
	onPopulateBlock: block => broker.enqueue(block),
})

describe("[Game] Flow", () => {
	it("1. Initialisation (determine turn order through rolling)", () => {
		const broker = new Broker()
		const alice = new Game(ALICE, [BOB.public, CHRIS.public], defaultCallbacks(broker))
		const bob = new Game(BOB, [ALICE.public, CHRIS.public], defaultCallbacks(broker))
		const chris = new Game(CHRIS, [BOB.public, ALICE.public], defaultCallbacks(broker))
		broker.connect([alice, bob, chris])

		assert.strictEqual(broker.count(), 3)
		broker.fanout()
	})
})

describe("[Game] Edge cases", () => {
	it("only accepts blocks where player is author", () => {
		const alice = new Game(ALICE, [BOB.public, CHRIS.public], defaultCallbacks(new Broker()))
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
