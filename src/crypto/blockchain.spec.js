const assert = require("assert")
const { Blockchain } = require("./blockchain")
const rsa = require("./rsa")

const { ALICE, BOB, CHRIS } = require("./rsa-testdata.json")

describe("[Blockchain] Creation", () => {
	it("stores basic info in initial block", () => {
		const b = new Blockchain(ALICE, [BOB.public])
		assert.deepStrictEqual(b.head(), [{
			precedingBlock: null,
			participants: {
				"a548f70d3a0d3b97b07afce03dcaa7863741bad5e8e2d44ec9419b55a6bce97d0142e25e22184a843f9ba6355ae4423dc952991ce9eb545161e194842a13367a": ALICE.public,
				"d7a6a8332de4bd112cea966061d76ff0f72b9403f062a2dbce78293bb54768422294e9833a302993516f1aed87ad0ff0c82e705e7fbf1a550d23b43d78db5ad0": BOB.public
			},
			protocolVersion: 0,
		}])
	})

	it("can replicate existing blockchain", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		assert.deepStrictEqual(aliceBlockchain.head(), bobBlockchain.head())
		
		assert.strictEqual(aliceBlockchain.owner(), ALICE.public)
		assert.strictEqual(bobBlockchain.owner(), BOB.public)
		
		assert.deepStrictEqual(aliceBlockchain.participants(), [ALICE.public, BOB.public])
		assert.deepStrictEqual(bobBlockchain.participants(), [ALICE.public, BOB.public])
	})
})

describe("[Blockchain] Block creation", () => {
	it("creates own block as new head of chain", () => {
		const b = new Blockchain(ALICE, [BOB.public])
		const payload1 = { action: "FOO" }
		b.commitOwnBlock({ state: "BAR" }, payload1)
		assert.deepStrictEqual(b.head()[0].payload, payload1)

		const payload2 = { action: "TEST_123" }
		b.commitOwnBlock({ state: "BAR" }, payload2)
		assert.deepStrictEqual(b.head()[0].payload, payload2)
	})

	it("signs own block correctly", () => {
		const b = new Blockchain(ALICE, [BOB.public])
		b.commitOwnBlock({ state: "BAR" }, { action: "FOO" })
		assert.strictEqual(rsa.verify(b.head()[0], ALICE.public), true)
		assert.strictEqual(rsa.verify(b.head()[0], BOB.public), false)
	})
})

describe("[Blockchain] Foreign blocks", () => {
	it("accepts foreign blocks as new head", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])
		const payload = { foo: 2 }

		aliceBlockchain.commitOwnBlock({ someState: 3126 }, payload)
		bobBlockchain.commitForeignBlock(
			{ someState: 3126 },
			aliceBlockchain.head()[0],
			(payload, author) => {
				assert.deepStrictEqual(payload, payload)
				assert.strictEqual(author, ALICE.public)
			}
		)

		assert.deepStrictEqual(aliceBlockchain.head(), bobBlockchain.head())
		assert.deepStrictEqual(aliceBlockchain.head().length, 1)
	})

	it("accepts foreign blocks as siblings in current head", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		aliceBlockchain.commitOwnBlock(null, { name: "alice" })
		bobBlockchain.commitOwnBlock(null, { name: "bobby" })

		aliceBlockchain.commitForeignBlock(null, bobBlockchain.head()[0])
		bobBlockchain.commitForeignBlock(null, aliceBlockchain.head()[0])

		assert.deepStrictEqual(aliceBlockchain.head(), bobBlockchain.head())
		assert.deepStrictEqual(
			aliceBlockchain.head().every((b, i, bs) => b.precedingBlock === bs[0].precedingBlock)
			, true)
		assert.deepStrictEqual(aliceBlockchain.head().length, 2)
	})

	it("rejects foreign blocks if transaction fails", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		aliceBlockchain.commitOwnBlock({ someState: 3126 }, { foo: 2 })

		const bobExpectedHead = bobBlockchain.head()
		assert.throws(
			() => {
				bobBlockchain.commitForeignBlock(
					{ someState: 3126 },
					aliceBlockchain.head()[0],
					() => { throw "some-custom-assertion" }
				)
			},
			e => e === "some-custom-assertion"
		)
		assert.strictEqual(bobBlockchain.head(), bobExpectedHead)
	})

	it("rejects foreign blocks from alien blockchain", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [CHRIS.public])

		aliceBlockchain.commitOwnBlock({}, { foo: 2 })

		assert.throws(
			() => bobBlockchain.commitForeignBlock({}, aliceBlockchain.head()[0]),
			e => e === "INCOMPATIBLE_BLOCK"
		)
	})

	it("rejects foreign blocks with invalid signature", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])
		const chrisBlockchain = new Blockchain(CHRIS, [BOB.public])

		bobBlockchain.commitOwnBlock({ state: "BAR" }, { action: "FOO" })
		chrisBlockchain.commitOwnBlock({ state: "BAR" }, { action: "FOO" })

		const corruptedBlock = {
			...bobBlockchain.head()[0],
			signature: chrisBlockchain.head()[0].signature
		}

		assert.throws(
			() => aliceBlockchain.commitForeignBlock({}, corruptedBlock),
			e => e === "INVALID_SIGNATURE"
		)
	})

	it("rejects foreign blocks that contain unknown properties", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		bobBlockchain.commitOwnBlock({ state: "BAR" }, { action: "FOO" })

		const corruptedBlock = {
			...bobBlockchain.head()[0],
			foo: 1,
			bar: "hello",
		}

		assert.throws(
			() => aliceBlockchain.commitForeignBlock({}, corruptedBlock),
			e => e === "MALFORMED_BLOCK"
		)
	})

	it("rejects foreign blocks that are based off an incompatible state", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		bobBlockchain.commitOwnBlock({ someState: 2 }, { action: "FOO" })

		assert.throws(
			() => aliceBlockchain.commitForeignBlock({ someState: 1928 }, bobBlockchain.head()[0]),
			e => e === "INCOMPATIBLE_STATE"
		)

	})
})
