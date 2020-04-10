const assert = require("assert")
const Blockchain = require("./blockchain")
const { ALICE, BOB } = require("./rsaTestUtil")

describe("[Blockchain] Creation", () => {
	it("stores basic info in initial block", () => {
		const b = Blockchain.createNew(ALICE, [BOB.public])
		const participants = {
			"4018f259129e14405d2c5100a02c203db9ba0d6a189aaf550515911900089888": ALICE.public,
			"1384680ecaf920b947d33e6710fd33ff1d2b6119e62393de506337e0ca09458d": BOB.public
		}
		assert.strictEqual(b.latestBlock().precedingBlock, null)
		assert.deepStrictEqual(b.latestBlock().participants, participants)
		assert.strictEqual(b.latestBlock().protocolVersion, 0)
		assert.strictEqual(b.latestBlock().guid.length, 64)
	})

	it("can replicate existing blockchain", () => {
		const aliceBlockchain = Blockchain.createNew(ALICE, [BOB.public])
		const bobBlockchain = Blockchain.createWithRoot(BOB, aliceBlockchain.latestBlock())

		assert.deepStrictEqual(aliceBlockchain.latestBlock(), bobBlockchain.latestBlock())
	})

	it("ensures uniqueness", () => {
		const aliceBlockchain1 = Blockchain.createNew(ALICE, [BOB.public])
		const aliceBlockchain2 = Blockchain.createNew(ALICE, [BOB.public])
		assert.notDeepStrictEqual(aliceBlockchain1.latestBlock(), aliceBlockchain2.latestBlock())
	})
})

describe("[Blockchain] Block management", () => {
	it("creates new block from payload", () => {
		const b = Blockchain.createNew(ALICE, [BOB.public])
		const payload = { action: "FOO" }

		b.stageOwnBlock({ state: "BAR" }, payload)
		const stagedBlock = b.stagedBlock()
		assert.deepStrictEqual(stagedBlock.payload, payload)
		assert.strictEqual(b.latestBlock().precedingBlock, null)

		b.commit()
		assert.deepStrictEqual(b.latestBlock(), stagedBlock)
		assert.deepStrictEqual(b.latestBlock().payload, payload)
		assert.strictEqual(b.stagedBlock(), null)
	})

	it("signs own block correctly") // todo

	it("cannot commit when nothing was staged", () => {
		const b = Blockchain.createNew(ALICE, [BOB.public])
		assert.throws(
			() => b.commit(),
			e => e === "NO_BLOCK_STAGED"
		)
	})

	it("can commit compatible foreign blocks", () => {
		const aliceBlockchain = Blockchain.createNew(ALICE, [BOB.public])
		const bobBlockchain = Blockchain.createWithRoot(BOB, aliceBlockchain.latestBlock())

		aliceBlockchain.stageOwnBlock({}, { foo: 2 })
		aliceBlockchain.commit()

		bobBlockchain.stageForeignBlock({}, aliceBlockchain.latestBlock())
		bobBlockchain.commit()

		assert.deepStrictEqual(aliceBlockchain.latestBlock(), bobBlockchain.latestBlock())
	})

	it("rejects incompatible foreign blocks upon staging", () => {
		const aliceBlockchain = Blockchain.createNew(ALICE, [BOB.public])
		const bobBlockchain = Blockchain.createNew(BOB, [])

		aliceBlockchain.stageOwnBlock({}, { foo: 2 })
		aliceBlockchain.commit()

		assert.throws(
			() => bobBlockchain.stageForeignBlock({}, aliceBlockchain.latestBlock()),
			e => e === "INCOMPATIBLE_BLOCK"
		)
	})
})
