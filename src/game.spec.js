const assert = require("assert")
const { Game } = require("./game")
const { random } = require("./crypto/dicecup")
const { toKeyO } = require("./crypto/rsa")
const { Blockchain } = require("./crypto/blockchain")
const { Broker } = require("./lib/fakebroker")

const { ALICE, BOB, CHRIS } = require("./lib/rsa-testdata.json")

const hashes = rs => rs.map(r => r.hash)
const seeds = rs => rs.map(r => r.seed)
const values = rs => rs.map(r => r.value)

const defaultCallbacks = (broker, state) => ({
	onPopulateBlock: block => broker.enqueue(block),
	onUpdate: newState => state.latest = newState,
	onTurn: (dices, record, select) => {
		if (select) {
			select([dices[0], null, dices[1], null, dices[3]])
		} else {
			record("yahtzee")
		}
	},
})

describe("[Game] Flow", () => {
	it("1. Initialisation (determine turn order through rolling)", () => {
		const broker = new Broker()
		const state = { latest: null }
		const alice = new Game(
			toKeyO(ALICE.public, ALICE.private),
			[toKeyO(BOB.public), toKeyO(CHRIS.public)],
			defaultCallbacks(broker, state)
		)
		const bob = new Game(
			toKeyO(BOB.public, BOB.private),
			[toKeyO(ALICE.public), toKeyO(CHRIS.public)],
			defaultCallbacks(broker, state)
		)
		const chris = new Game(
			toKeyO(CHRIS.public, CHRIS.private),
			[toKeyO(BOB.public), toKeyO(ALICE.public)],
			defaultCallbacks(broker, state)
		)
		broker.connect([alice, bob, chris])

		// initialisation phase:
		assert.strictEqual(state.latest, null)
		broker.fanout(6) // rolling: 3 players * (1 hashes + 1 values)
		assert.notStrictEqual(state.latest, null)

		// first roll:
		assert.strictEqual(state.latest.onTurn, 0)
		assert.strictEqual(state.latest.attempt, 0)
		assert.strictEqual(state.latest.dices.every(d => d === null), true)
		broker.fanout(6) // rolling
		assert.strictEqual(state.latest.dices.some(d => d === null), true)

		// second roll, after player on turn has selected:
		broker.fanout(1) // select
		assert.strictEqual(state.latest.attempt, 1)
		broker.fanout(6) // rolling
		
		// third roll, after player on turn has selected:
		broker.fanout(1) // select
		assert.strictEqual(state.latest.attempt, 2)
		broker.fanout(6) // rolling

		// finishing player’s  turn:
		broker.fanout(1) // record
		assert.strictEqual(state.latest.onTurn, 1)
		assert.strictEqual(state.latest.attempt, 0)
		broker.fanout(6) // rolling
	})
})

describe("[Game] Edge cases", () => {
	it("only accepts blocks where player is author", () => {
		const alice = new Game(
			toKeyO(ALICE.public, ALICE.private),
			[toKeyO(BOB.public), toKeyO(CHRIS.public)],
			defaultCallbacks(new Broker())
		)
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public), toKeyO(CHRIS.public)])

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
