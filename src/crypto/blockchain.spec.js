const assert = require("assert")
const { Blockchain } = require("./blockchain")
const { verify, toKeyO } = require("./rsa")

const { ALICE, BOB, CHRIS } = require("../lib/rsa-testdata.json")

describe("[Blockchain] Creation", () => {
	it("stores basic info in initial block", () => {
		const b = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		assert.deepStrictEqual(b.head(), [{
			precedingBlock: null,
			participants: [
				"23e09067fd2b7e2c2799c8f5d4a6536602237c8e5dab31903a7c5b0f59294fccdf20a0075797f686b054fce4dbbac59cf03d49197c635e301838b91dedb301d1",
				"bce6140d0860706c8cdb78366d732de1e6ffe7fd117de479020ce5e9c91a277d9357f984f9a421b5ad21291d7eb49823a16488a8092e4cebfbb2dccb5baceec0",
			],
			protocolVersion: 0,
		}])
	})

	it("can replicate existing blockchain", () => {
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])

		assert.deepStrictEqual(aliceBlockchain.head(), bobBlockchain.head())

		assert.strictEqual(aliceBlockchain.ownerFinger(), ALICE.finger)
		assert.strictEqual(bobBlockchain.ownerFinger(), BOB.finger)

		assert.deepStrictEqual(aliceBlockchain.participantsFinger(), [ALICE.finger, BOB.finger])
		assert.deepStrictEqual(bobBlockchain.participantsFinger(), [ALICE.finger, BOB.finger])
	})
})

describe("[Blockchain] Block creation", () => {
	it("creates own block as new head of chain", () => {
		const b = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const payload1 = { action: "FOO" }
		b.commitOwnBlock({ state: "BAR" }, payload1)
		assert.deepStrictEqual(b.head()[0].payload, payload1)

		const payload2 = { action: "TEST_123" }
		b.commitOwnBlock({ state: "BAR" }, payload2)
		assert.deepStrictEqual(b.head()[0].payload, payload2)
	})

	it("signs own block correctly", () => {
		const b = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		b.commitOwnBlock({ state: "BAR" }, { action: "FOO" })
		assert.strictEqual(verify(b.head()[0], ALICE.public), true)
		assert.strictEqual(verify(b.head()[0], BOB.public), false)
	})
})

describe("[Blockchain] Foreign blocks", () => {
	it("accepts foreign blocks as new head", () => {
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])
		const payload = { foo: 2 }

		aliceBlockchain.commitOwnBlock({ someState: 3126 }, payload)
		bobBlockchain.commitForeignBlock(
			{ someState: 3126 },
			aliceBlockchain.head()[0],
			(payload, author) => {
				assert.deepStrictEqual(payload, payload)
				assert.strictEqual(author, ALICE.finger)
			}
		)

		assert.deepStrictEqual(aliceBlockchain.head(), bobBlockchain.head())
		assert.deepStrictEqual(aliceBlockchain.head().length, 1)
	})

	it("accepts foreign blocks as siblings in current head", () => {
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])

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
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])

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
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(CHRIS.public)])

		aliceBlockchain.commitOwnBlock({}, { foo: 2 })

		assert.throws(
			() => bobBlockchain.commitForeignBlock({}, aliceBlockchain.head()[0]),
			e => e === "INCOMPATIBLE_BLOCK"
		)
	})

	it("rejects foreign blocks with invalid signature", () => {
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])
		const chrisBlockchain = new Blockchain(toKeyO(CHRIS.public, CHRIS.private), [toKeyO(BOB.public)])

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
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])

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
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])

		bobBlockchain.commitOwnBlock({ someState: 2 }, { action: "FOO" })

		assert.throws(
			() => aliceBlockchain.commitForeignBlock({ someState: 1928 }, bobBlockchain.head()[0]),
			e => e === "INCOMPATIBLE_STATE"
		)
	})

	it("ignores duplicates", () => {
		const aliceBlockchain = new Blockchain(toKeyO(ALICE.public, ALICE.private), [toKeyO(BOB.public)])
		const bobBlockchain = new Blockchain(toKeyO(BOB.public, BOB.private), [toKeyO(ALICE.public)])

		bobBlockchain.commitOwnBlock(null, { action: "FOO" })
		aliceBlockchain.commitForeignBlock(null, bobBlockchain.head()[0])

		const aliceHead = aliceBlockchain.head()
		aliceBlockchain.commitForeignBlock(null, bobBlockchain.head()[0])
		assert.deepStrictEqual(aliceBlockchain.head(), aliceHead)
	})
})
