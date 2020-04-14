const assert = require("assert")
const { Game } = require("./game")
const { random } = require("./crypto/dicecup")
const { Blockchain } = require("./crypto/blockchain")
const { Broker } = require("./lib/fakebroker")

const { ALICE, BOB, CHRIS } = require("./crypto/rsa-testdata.json")

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
		const alice = new Game(ALICE, [BOB.public, CHRIS.public], defaultCallbacks(broker, state))
		const bob = new Game(BOB, [ALICE.public, CHRIS.public], defaultCallbacks(broker, state))
		const chris = new Game(CHRIS, [BOB.public, ALICE.public], defaultCallbacks(broker, state))
		broker.connect([alice, bob, chris])

		// initialisation phase:
		broker.fanout(6) // rolling: 3 players * (1 hashes + 1 values)

		// first roll:
		broker.fanout(6) // rolling
		assert.strictEqual(state.latest.onTurn, 0)
		assert.strictEqual(state.latest.attempt, 1)
		assert.strictEqual(state.latest.dices.every(d => d !== null), true)

		// second roll, after player on turn has selected:
		broker.fanout(1) // select
		broker.fanout(6) // rolling
		assert.strictEqual(state.latest.attempt, 2)
		
		// third roll, after player on turn has selected:
		broker.fanout(1) // select
		broker.fanout(6) // rolling
		assert.strictEqual(state.latest.attempt, 3)

		// finishing player’s  turn:
		broker.fanout(1) // record
		broker.fanout(6) // rolling
		assert.strictEqual(state.latest.onTurn, 1)
		assert.strictEqual(state.latest.attempt, 1)
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

	it("can handle when blocks come in in wrong order", () => {
		const alicePopulatedBlocks = []
		const alice = new Game(ALICE, [BOB.public, CHRIS.public], {
			onPopulateBlock: block => alicePopulatedBlocks.push(block)
		})
		const bobBlockchain = new Blockchain(BOB, [ALICE.public, CHRIS.public])
		const chrisBlockchain = new Blockchain(CHRIS, [ALICE.public, BOB.public])

		// Bob and Chris generate their hashes
		const bobRs = [random(), random(), random()]
		bobBlockchain.commitOwnBlock(
			null,
			{ type: "DICECUP_HASHES", player: BOB.public, seeds: seeds(bobRs), hashes: hashes(bobRs) }
		)
		const chrisRs = [random(), random(), random()]
		chrisBlockchain.commitOwnBlock(
			null,
			{ type: "DICECUP_HASHES", player: CHRIS.public, seeds: seeds(chrisRs), hashes: hashes(chrisRs) }
		)

		// Bob and Chris send out their data, but the connection [Alice-Chris] is delayed
		alice.receiveBlock(bobBlockchain.head()[0])
		bobBlockchain.commitForeignBlock(null, chrisBlockchain.head()[0])
		bobBlockchain.commitForeignBlock(null, alicePopulatedBlocks[0])

		// Bob’s hashing is complete now, so he proceeds populating his values
		bobBlockchain.commitOwnBlock(null, { type: "DICECUP_VALUES", player: BOB.public, values: values(bobRs) })

		// Bob already sends his new block to Alice
		// Alice cannot process it yet, but she will already accept it anyway
		assert.doesNotThrow(() => alice.receiveBlock(bobBlockchain.head()[0]))

		// Now Alice finally receives Chris block.
		// That way she can flush her block buffer and proceed
		alice.receiveBlock(chrisBlockchain.head()[0])
		assert.strictEqual(alicePopulatedBlocks.length, 2)
		assert.strictEqual(alicePopulatedBlocks[1].precedingBlock, bobBlockchain.head()[0].precedingBlock)
	})
})
