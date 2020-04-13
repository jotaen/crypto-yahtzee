const assert = require("assert")
const { isHash, isHexString } = require("./hash")
const { DiceCup, toDices, random } = require("./dicecup")

const hashes = rs => rs.map(r => r.hash)
const seeds = rs => rs.map(r => r.seed)
const values = rs => rs.map(r => r.value)

describe("[DiceCup] Generation", () => {
	it("calculates a random value based on the values of every player", () => {
		const alice = [random(), random(), random(), random(), random()]
		const bob = [random(), random(), random(), random(), random()]
		const chris = [random(), random(), random(), random(), random()]

		const dc = new DiceCup(5, ["ALICE", "BOB", "CHRIS"])
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: seeds(alice), hashes: hashes(alice) })
		dc.dispatch({ type: "DICECUP_HASHES", player: "BOB", seeds: seeds(bob), hashes: hashes(bob) })
		dc.dispatch({ type: "DICECUP_HASHES", player: "CHRIS", seeds: seeds(chris), hashes: hashes(chris) })
		dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: values(alice) })
		dc.dispatch({ type: "DICECUP_VALUES", player: "BOB", values: values(bob) })
		assert.strictEqual(dc.isRolled(), false)
		dc.dispatch({ type: "DICECUP_VALUES", player: "CHRIS", values: values(chris) })
		assert.strictEqual(dc.isRolled(), true)
		assert.strictEqual(dc.retrieveNumbers().length, 5)
		assert.strictEqual(dc.retrieveNumbers().every(n => Number.isInteger(n)), true)
	})

	it("uses sha256 hashes & seeds, and 32-bit hex values", () => {
		const dc = new DiceCup(2, ["ALICE", "BOB"])
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: [
				"fbd0ed2087be3dafb52fd873c8a30a83cdd347c173c752b9fb31897f07ebc76d",
				"deab94ad3fef33bfac696c5fa5a507044d8ae4138d07a96618caf990f5fba66c"
			], hashes: [
				"dde58fdd5818f862937a503cc411dfdd78e03b25575a4da3c4f53e0ef977dce7",
				"0a38276618e2b1342905b88b5da578ab386a54b369e0665895b64202e4f89dee",
			] })
		dc.dispatch({ type: "DICECUP_HASHES", player: "BOB", seeds: [
				"5f53131e72425adfb6a007f61309deeb11ccfa06f0156703079c855e995bd71b",
				"b736994617eb6d9a573342120f383686447dad1688fb25838dc674ca29b83687"
			], hashes: [
				"481b2ada2ae51c636a0080104af4fa70dabc0615e6cb96571ce428f3351f0f5d",
				"6b5f20d35b4c6fbfec5b643775f220b0852c33ba2a887e6aaa4071c8c2a64308",
			] })
		dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: ["6b2df804", "02713fef"] })
		assert.strictEqual(dc.isRolled(), false)
		dc.dispatch({ type: "DICECUP_VALUES", player: "BOB", values: ["7d6d2b55", "bc0150fb"] })
		assert.strictEqual(dc.isRolled(), true)
		assert.deepStrictEqual(dc.retrieveNumbers(), [373347153, -1099927788])
	})

	it("cannot overwrite values", () => {
		const alice = [random()]
		const alice2 = [random()]
		const dc = new DiceCup(1, ["ALICE"])
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: seeds(alice), hashes: hashes(alice) })
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: seeds(alice2), hashes: hashes(alice2) }),
			e => e === "ALREADY_SUBMITTED"
		)
		dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: values(alice) })
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: values(alice2) }),
			e => e === "ALREADY_SUBMITTED"
		)
	})

	it("rejects formally incorrect values/types", () => {
		const dc = new DiceCup(3, ["ALICE"])
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: ["", "!*&^TGAIS*F&", 2127], hashes: ["", "!*&^TGAIS*F&", 2127] }),
			e => e === "BAD_ACTION"
		)
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: ["", "*&T@*&UR!SFS", 5123] }),
			e => e === "BAD_ACTION"
		)
	})

	it("cannot submit data for non-participant", () => {
		const dc = new DiceCup(1, ["ALICE"])
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_HASHES", player: "A*&FS^&A*G", seeds: [random().seed], hashes: [random().hash] }),
			e => e === "NOT_PARTICIPANT"
		)
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "A*&FS^&A*G", values: [random().value] }),
			e => e === "NOT_PARTICIPANT"
		)
	})

	it("collects hashes before values", () => {
		const dc = new DiceCup(1, ["ALICE", "BOB"])
		const alice = [random()]
		const bob = [random()]
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: values(alice) }),
			e => e === "HASHES_NOT_COMPLETE_YET"
		)
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "BOB", values: values(bob) }),
			e => e === "HASHES_NOT_COMPLETE_YET"
		)
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: seeds(alice), hashes: hashes(alice) })
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: values(alice) }),
			e => e === "HASHES_NOT_COMPLETE_YET"
		)
	})

	it("rejects adding seeds/hashes/values with wrong type/arity", () => {
		const dc = new DiceCup(1, ["ALICE"])
		const alice = [random()]
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: seeds(alice), hashes: hashes(alice) })

		;[
			[],
			[random().hash, random().hash],
			[random().hash, random().hash, random().hash, random().hash],
		].forEach(t => assert.throws(
			() => dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: t, hashes: [random().hash] }),
			e => e === "WRONG_ARITY"
		))

		;[
			[],
			[random().hash, random().hash],
			[random().hash, random().hash, random().hash, random().hash],
		].forEach(t => assert.throws(
			() => dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: [random().seed], hashes: t }),
			e => e === "WRONG_ARITY"
		))

		;[
			[],
			[random().value, random().value],
			[random().value, random().value, random().value, random().value],
		].forEach(t => assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: t }),
			e => e === "WRONG_ARITY"
		))
	})

	it("verifies seed-value integrity", () => {
		const dc = new DiceCup(1, ["ALICE"])
		const alice = [random()]
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: seeds(alice), hashes: hashes(alice) })
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: [random().value] }),
			e => e === "HASH_VALUE_MISMATCH"
		)
	})

	it("verifies hash-seed integrity", () => {
		const dc = new DiceCup(1, ["ALICE"])
		const alice = [random()]
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: [random().seed], hashes: hashes(alice) })
		assert.throws(
			() => dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: values(alice) }),
			e => e === "HASH_VALUE_MISMATCH"
		)
	})

	it("doesn’t return result when input is not complete", () => {
		const alice = [random()]
		const bob = [random()]
		const dc = new DiceCup(1, ["ALICE", "BOB"])
		dc.dispatch({ type: "DICECUP_HASHES", player: "ALICE", seeds: seeds(alice), hashes: hashes(alice) })
		dc.dispatch({ type: "DICECUP_HASHES", player: "BOB", seeds: seeds(bob), hashes: hashes(bob) })
		dc.dispatch({ type: "DICECUP_VALUES", player: "ALICE", values: values(alice) })
		assert.throws(
			() => dc.retrieveNumbers(),
			e => e === "INPUT_NOT_COMPLETE_YET"
		)
	})
})

describe("[DiceCup] random()", () => {
	it("generates bit sequences as string of specified length", () => {
		const r = random()
		assert.strictEqual(isHash(r.hash), true)
		assert.strictEqual(isHash(r.seed), true)
		assert.strictEqual(isHexString(8)(r.value), true)
	})

	it("yields different outputs every time", () => {
		assert.notDeepStrictEqual(random(), random())
	})
})

describe("[DiceCup] Conversion", () => {
	it("yields values in the range [1-6]", () => {
		assert.deepStrictEqual(toDices([0]), [1])
		assert.deepStrictEqual(toDices([1]), [2])
		assert.deepStrictEqual(toDices([2]), [3])
		assert.deepStrictEqual(toDices([3]), [4])
		assert.deepStrictEqual(toDices([4]), [5])
		assert.deepStrictEqual(toDices([5]), [6])
		assert.deepStrictEqual(toDices([6]), [1])
		assert.deepStrictEqual(toDices([4, 7, 9, 123]), [5, 2, 4, 4])
		assert.deepStrictEqual(toDices([373347153]), [4])
		assert.deepStrictEqual(toDices([-1099927788]), [1])
	})
})

describe.skip("[DiceCup] Integration test", () => {
	//
	//	Test to check the distribution of resulting values
	//  Leave skipped, because it’s slow
	//

	it("distributes the value evenly across the spectrum", () => {
		const result = {}
		const iterations = 20000
		for (let i=0; i<iterations; i++) {
			const players = [
				{name: "ALICE", rand: random()},
				{name: "BOB", rand: random()},
			]
			const dc = new DiceCup(1, players.map(p => p.name))
			players.forEach(p => {
				dc.dispatch({ type: "DICECUP_HASHES", player: p.name, seeds: [p.rand.seed], hashes: [p.rand.hash] })
			})
			players.forEach(p => {
				dc.dispatch({ type: "DICECUP_VALUES", player: p.name, values: [p.rand.value] })
			})
			const x = toDices(dc.retrieveNumbers())
			if (! (x in result)) {
				result[x] = 0
			}
			result[x] = result[x] + 1
		}
		console.log(result)
		const distribution = Object.values(result).sort((a,b) => a-b)
		const min = distribution[0]
		const max = distribution[distribution.length-1]

		// due to random values, this assertation is allowed to fail occasionally
		assert.strictEqual((max-min)/max < 0.1, true)
	})
})
