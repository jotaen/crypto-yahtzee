const assert = require("assert")
const { Blockchain } = require("./blockchain")
const rsa = require("./rsa")

const { ALICE, BOB, CHRIS } = require("./rsa-testdata.json")

describe("[Blockchain] Creation", () => {
	it("stores basic info in initial block", () => {
		const b = new Blockchain(ALICE, [BOB.public])
		assert.deepStrictEqual(b.latestBlock(), {
			precedingBlock: null,
			participants: {
				"4018f259129e14405d2c5100a02c203db9ba0d6a189aaf550515911900089888": ALICE.public,
				"1384680ecaf920b947d33e6710fd33ff1d2b6119e62393de506337e0ca09458d": BOB.public
			},
			protocolVersion: 0,
		})
	})

	it("can replicate existing blockchain", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		assert.deepStrictEqual(aliceBlockchain.latestBlock(), bobBlockchain.latestBlock())
		
		assert.strictEqual(aliceBlockchain.owner(), ALICE.public)
		assert.strictEqual(bobBlockchain.owner(), BOB.public)
		
		assert.deepStrictEqual(aliceBlockchain.participants(), [ALICE.public, BOB.public])
		assert.deepStrictEqual(bobBlockchain.participants(), [ALICE.public, BOB.public])
	})
})

describe("[Blockchain] Block creation", () => {
	it("creates and signs own block correctly", () => {
		const b = new Blockchain(ALICE, [BOB.public])
		const payload = { action: "FOO" }
		b.stageOwnBlock({ state: "BAR" }, payload)
		b.commit()
		assert.deepStrictEqual(b.latestBlock().payload, payload)
		assert.strictEqual(rsa.verify(b.latestBlock(), ALICE.public), true)
		assert.strictEqual(rsa.verify(b.latestBlock(), BOB.public), false)
	})

	it("cannot commit when nothing was staged", () => {
		const b = new Blockchain(ALICE, [BOB.public])
		assert.throws(
			() => b.commit(),
			e => e === "NO_BLOCK_STAGED"
		)
	})
})

describe("[Blockchain] Foreign blocks", () => {
	it("accepts compatible foreign blocks", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		aliceBlockchain.stageOwnBlock({ someState: 3126 }, { foo: 2 })
		aliceBlockchain.commit()

		bobBlockchain.stageForeignBlock({ someState: 3126 }, aliceBlockchain.latestBlock())
		bobBlockchain.commit()

		assert.deepStrictEqual(aliceBlockchain.latestBlock(), bobBlockchain.latestBlock())
	})

	it("rejects foreign blocks from alien blockchain", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [])

		aliceBlockchain.stageOwnBlock({}, { foo: 2 })
		aliceBlockchain.commit()

		assert.throws(
			() => bobBlockchain.stageForeignBlock({}, aliceBlockchain.latestBlock()),
			e => e === "INCOMPATIBLE_BLOCK"
		)
	})

	it("rejects foreign blocks with invalid signature", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])
		const chrisBlockchain = new Blockchain(CHRIS, [BOB.public])

		bobBlockchain.stageOwnBlock({ state: "BAR" }, { action: "FOO" })
		bobBlockchain.commit()

		chrisBlockchain.stageOwnBlock({ state: "BAR" }, { action: "FOO" })
		chrisBlockchain.commit()

		const corruptedBlock = {
			...bobBlockchain.latestBlock(),
			signature: chrisBlockchain.latestBlock().signature
		}

		assert.throws(
			() => aliceBlockchain.stageForeignBlock({}, corruptedBlock),
			e => e === "INVALID_SIGNATURE"
		)
	})

	it("rejects foreign blocks that contain unknown properties", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		bobBlockchain.stageOwnBlock({ state: "BAR" }, { action: "FOO" })
		bobBlockchain.commit()

		const corruptedBlock = {
			...bobBlockchain.latestBlock(),
			foo: 1,
			bar: "hello",
		}

		assert.throws(
			() => aliceBlockchain.stageForeignBlock({}, corruptedBlock),
			e => e === "MALFORMED_BLOCK"
		)
	})

	it("rejects foreign blocks that are based off an incompatible state", () => {
		const aliceBlockchain = new Blockchain(ALICE, [BOB.public])
		const bobBlockchain = new Blockchain(BOB, [ALICE.public])

		bobBlockchain.stageOwnBlock({ someState: 2 }, { action: "FOO" })
		bobBlockchain.commit()

		assert.throws(
			() => aliceBlockchain.stageForeignBlock({ someState: 1928 }, bobBlockchain.latestBlock()),
			e => e === "INCOMPATIBLE_STATE"
		)

	})
})
