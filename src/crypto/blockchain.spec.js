const assert = require("assert")
const Blockchain = require("./blockchain")
const rsa = require("./rsa")

const { ALICE, BOB, CHRIS } = require("./testdata.json")

describe("[Blockchain] Creation", () => {
	it("stores basic info in initial block", () => {
		const b = Blockchain.createNew("123", ALICE, [BOB.public])
		assert.deepStrictEqual(b.latestBlock(), {
			precedingBlock: null,
			participants: {
				"4018f259129e14405d2c5100a02c203db9ba0d6a189aaf550515911900089888": ALICE.public,
				"1384680ecaf920b947d33e6710fd33ff1d2b6119e62393de506337e0ca09458d": BOB.public
			},
			protocolVersion: 0,
			guid: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
		})
	})

	it("can replicate existing blockchain", () => {
		const aliceBlockchain = Blockchain.createNew("123", ALICE, [BOB.public])
		const bobBlockchain = Blockchain.createWithRoot(BOB, aliceBlockchain.latestBlock())

		assert.deepStrictEqual(aliceBlockchain.latestBlock(), bobBlockchain.latestBlock())
	})

	it("ensures uniqueness", () => {
		const aliceBlockchain1 = Blockchain.createNew("123", ALICE, [BOB.public])
		const aliceBlockchain2 = Blockchain.createNew("abc", ALICE, [BOB.public])
		assert.notDeepStrictEqual(aliceBlockchain1.latestBlock(), aliceBlockchain2.latestBlock())
	})
})

describe("[Blockchain] Block management", () => {
	it("creates new block from payload", () => {
		const b = Blockchain.createNew("123", ALICE, [BOB.public])
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

	it("signs own block correctly", () => {
		const b = Blockchain.createNew("123", ALICE, [BOB.public])
		b.stageOwnBlock({ state: "BAR" }, { action: "FOO" })
		b.commit()
		assert.strictEqual(rsa.verify(b.latestBlock(), ALICE.public), true)
		assert.strictEqual(rsa.verify(b.latestBlock(), BOB.public), false)
	})

	it("rejects foreign blocks with invalid signature", () => {
		const aliceBlockchain = Blockchain.createNew("123", ALICE, [BOB.public])
		const bobBlockchain = Blockchain.createWithRoot(BOB, aliceBlockchain.latestBlock())
		const chrisBlockchain = Blockchain.createNew("234", CHRIS, [BOB.public])

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

	it("cannot commit when nothing was staged", () => {
		const b = Blockchain.createNew("123", ALICE, [BOB.public])
		assert.throws(
			() => b.commit(),
			e => e === "NO_BLOCK_STAGED"
		)
	})

	it("can commit compatible foreign blocks", () => {
		const aliceBlockchain = Blockchain.createNew("123", ALICE, [BOB.public])
		const bobBlockchain = Blockchain.createWithRoot(BOB, aliceBlockchain.latestBlock())

		aliceBlockchain.stageOwnBlock({}, { foo: 2 })
		aliceBlockchain.commit()

		bobBlockchain.stageForeignBlock({}, aliceBlockchain.latestBlock())
		bobBlockchain.commit()

		assert.deepStrictEqual(aliceBlockchain.latestBlock(), bobBlockchain.latestBlock())
	})

	it("rejects incompatible foreign blocks upon staging", () => {
		const aliceBlockchain = Blockchain.createNew("123", ALICE, [BOB.public])
		const bobBlockchain = Blockchain.createNew("abc", BOB, [])

		aliceBlockchain.stageOwnBlock({}, { foo: 2 })
		aliceBlockchain.commit()

		assert.throws(
			() => bobBlockchain.stageForeignBlock({}, aliceBlockchain.latestBlock()),
			e => e === "INCOMPATIBLE_BLOCK"
		)
	})
})
