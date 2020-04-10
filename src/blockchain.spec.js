const assert = require("assert")
const Blockchain = require("./blockchain")
const { ALICE, BOB } = require("./rsaTestUtil")

describe("[Blockchain]", () => {
	it("stores basic info in initial block", () => {
		const b = Blockchain.createNew(ALICE, [BOB.public])
		assert.deepStrictEqual(b.latestBlock(), {
			precedingBlock: null,
			participants: {
				"4018f259129e14405d2c5100a02c203db9ba0d6a189aaf550515911900089888": ALICE.public,
				"1384680ecaf920b947d33e6710fd33ff1d2b6119e62393de506337e0ca09458d": BOB.public
			},
			protocolVersion: 0,
		})
	})

	it("creates new block from payload", () => {
		const b = Blockchain.createNew(ALICE, [BOB.public])
		const payload = { action: "FOO" }
		const newBlock = {
			precedingBlock: "197dcb3c606a8729ba480a6c034c80d729407f00f0f3d1808a6b8637fd3bf46d",
			actor: "4018f259129e14405d2c5100a02c203db9ba0d6a189aaf550515911900089888",
			state: "72d48bd9cc33536f4885db740293f3d2c7968784bdfc8827682afca431c5c5dc",
			payload: payload,
		}

		b.stageOwnBlock({ state: "BAR" }, payload)
		assert.deepStrictEqual(b.stagedBlock(), newBlock)
		assert.strictEqual(b.latestBlock().precedingBlock, null)

		b.commit()
		assert.deepStrictEqual(b.latestBlock(), newBlock)
		assert.strictEqual(b.stagedBlock(), null)
	})

	it("cannot commit when nothing was staged", () => {
		const b = Blockchain.createNew(ALICE, [BOB.public])
		assert.throws(
			() => b.commit(),
			e => e === "NO_BLOCK_STAGED"
		)
	})
})
