const assert = require("assert")
const { isHash, isHexString } = require("./hash")
const { DiceCup, toDices, random } = require("./dicecup")

describe("[DiceCup] Generation", () => {
	it("calculates a random value based on the values of every player", () => {
		const alice = [random(), random(), random(), random(), random()]
		const bob = [random(), random(), random(), random(), random()]
		const chris = [random(), random(), random(), random(), random()]

		const dc1 = new DiceCup(5, ["ALICE", "BOB", "CHRIS"])
		dc1.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: alice.map(r => r.hash) })
		dc1.dispatch({ type: "SEED_HASHES", player: "BOB", hashes: bob.map(r => r.hash) })
		dc1.dispatch({ type: "SEED_HASHES", player: "CHRIS", hashes: chris.map(r => r.hash) })
		dc1.dispatch({ type: "SEED_VALUES", player: "ALICE", values: alice.map(r => r.value) })
		dc1.dispatch({ type: "SEED_VALUES", player: "BOB", values: bob.map(r => r.value) })
		assert.strictEqual(dc1.isRolled(), false)
		dc1.dispatch({ type: "SEED_VALUES", player: "CHRIS", values: chris.map(r => r.value) })
		assert.strictEqual(dc1.isRolled(), true)
		assert.strictEqual(dc1.retrieveNumbers().length, 5)
		assert.strictEqual(dc1.retrieveNumbers().every(n => Number.isInteger(n)), true)

		const dc2 = new DiceCup(2, ["ALICE", "BOB"])
		dc2.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [
				"fbd0ed2087be3dafb52fd873c8a30a83cdd347c173c752b9fb31897f07ebc76d",
				"deab94ad3fef33bfac696c5fa5a507044d8ae4138d07a96618caf990f5fba66c"
			] })
		dc2.dispatch({ type: "SEED_HASHES", player: "BOB", hashes: [
				"5f53131e72425adfb6a007f61309deeb11ccfa06f0156703079c855e995bd71b",
				"b736994617eb6d9a573342120f383686447dad1688fb25838dc674ca29b83687"
			] })
		dc2.dispatch({ type: "SEED_VALUES", player: "ALICE", values: ["6b2df804", "02713fef"] })
		assert.strictEqual(dc2.isRolled(), false)
		dc2.dispatch({ type: "SEED_VALUES", player: "BOB", values: ["7d6d2b55", "bc0150fb"] })
		assert.strictEqual(dc2.isRolled(), true)
		assert.deepStrictEqual(dc2.retrieveNumbers(), [373347153, -1099927788])
	})

	it("cannot overwrite values", () => {
		const alice = random()
		const dc = new DiceCup(1, ["ALICE"])
		dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [alice.hash] })
		dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: [alice.value] })
		assert.throws(
			() => dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] }),
			e => e === "ALREADY_SUBMITTED"
		)
		assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
			e => e === "ALREADY_SUBMITTED"
		)
	})

	it("rejects formally incorrect values/types", () => {
		const dc = new DiceCup(3, ["ALICE"])
		assert.throws(
			() => dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: ["", "!*&^TGAIS*F&", 2127] }),
			e => e === "BAD_ACTION"
		)
		assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: ["", "*&T@*&UR!SFS", 5123] }),
			e => e === "BAD_ACTION"
		)
	})

	it("cannot submit data for non-participant", () => {
		const dc = new DiceCup(2, ["ALICE"])
		assert.throws(
			() => dc.dispatch({ type: "SEED_HASHES", player: "A*&FS^&A*G", hashes: [random().hash, random().hash] }),
			e => e === "NOT_PARTICIPANT"
		)
		assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "A*&FS^&A*G", values: [random().value, random().value] }),
			e => e === "NOT_PARTICIPANT"
		)
	})

	it("collects hashes before values", () => {
		const dc = new DiceCup(1, ["ALICE", "BOB"])
		assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
			e => e === "HASHES_NOT_COMPLETE_YET"
		)
		assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "BOB", values: [random().value] }),
			e => e === "HASHES_NOT_COMPLETE_YET"
		)
		dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] })
		assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
			e => e === "HASHES_NOT_COMPLETE_YET"
		)
	})

	it("rejects adding hashes/values with wrong type/arity", () => {
		const dc = new DiceCup(1, ["ALICE"])
		dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] })

		;[
			[],
			[random().hash, random().hash],
			[random().hash, random().hash, random().hash, random().hash],
		].forEach(t => assert.throws(
			() => dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: t }),
			e => e === "WRONG_ARITY"
		))

		;[
			[],
			[random().value, random().value],
			[random().value, random().value, random().value, random().value],
		].forEach(t => assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: t }),
			e => e === "WRONG_ARITY"
		))
	})

	it("checks for value integrity", () => {
		const dc = new DiceCup(1, ["ALICE"])
		dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] })
		assert.throws(
			() => dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
			e => e === "HASH_VALUE_MISMATCH"
		)
	})

	it("doesn’t return result when input is not complete", () => {
		const alice = random()
		const bob = random()
		const dc = new DiceCup(1, ["ALICE", "BOB"])
		dc.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [alice.hash] })
		dc.dispatch({ type: "SEED_HASHES", player: "BOB", hashes: [bob.hash] })
		dc.dispatch({ type: "SEED_VALUES", player: "ALICE", values: [alice.value] })
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

	const { dice } = require("./hash")

	it("distributes the value evenly across the spectrum", () => {
		const result = {}
		const iterations = 99999
		for (let i=0; i<iterations; i++) {
			const participants = ["ALICE", "BOB"]
			const cr = init(1, participants)
			participants
				.map((p) => ({ p: p, r: random() }))
				.forEach(x => {
					cr.submitHashes(x.p, [x.r.hash])
					cr.submitValues(x.p, [x.r.value])
				})
			const x = dice(cr.retrieveNumbers()[0])
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
		assert.strictEqual((max-min)/max < 0.05, true)
	})
})
