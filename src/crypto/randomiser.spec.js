const assert = require("assert")
const { ConcertedRandomiser, random, VALUE_STRING_LENGTH } = require("./randomiser")

describe("[Randomiser] Generation", () => {
	it("takes data for every player", () => {
		const s = new ConcertedRandomiser(2, ["ALICE", "BOB", "CHRIS"])
		s.submitHashes("ALICE", [random().hash, random().hash])
		s.submitHashes("BOB", [random().hash, random().hash])
		s.submitHashes("CHRIS", [random().hash, random().hash])
	})

	it("cannot overwrite values", () => {
		const s = new ConcertedRandomiser(1, ["ALICE", "BOB", "CHRIS"])
		const alice = random()
		s.submitHashes("ALICE", [alice.hash])
		s.submitValues("ALICE", [alice.value])
		assert.throws(
			() => s.submitHashes("ALICE", [random().hash]),
			e => e === "ALREADY_SUBMITTED"
		)
		assert.throws(
			() => s.submitValues("ALICE", [random().value]),
			e => e === "ALREADY_SUBMITTED"
		)
	})

	it("rejects formally incorrect values/types", () => {
		const s = new ConcertedRandomiser(3, ["ALICE", "BOB", "CHRIS"])
		assert.throws(
			() => s.submitHashes("ALICE", ["", "!*&^TGAIS*F&", 2127]),
			e => e === "MALFORMED_VALUE"
		)
		assert.throws(
			() => s.submitValues("ALICE", ["", "*&T@*&UR!SFS", 5123]),
			e => e === "MALFORMED_VALUE"
		)
	})

	it("cannot submit data for non-participant", () => {
		const s = new ConcertedRandomiser(2, ["ALICE", "BOB", "CHRIS"])
		assert.throws(
			() => s.submitHashes("MALICIOUS", [random().hash, random().hash]),
			e => e === "NOT_PARTICIPANT"
		)
		assert.throws(
			() => s.submitValues("MALICIOUS", [random().value, random().value]),
			e => e === "NOT_PARTICIPANT"
		)
	})

	it("rejects adding hashes with wrong arity", () => {
		const s = new ConcertedRandomiser(3, ["ALICE"])
		assert.throws(
			() => s.submitHashes("ALICE", null),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitHashes("ALICE", "aced120"),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitHashes("ALICE", []),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitHashes("ALICE", ["aced120", "aced120"]),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitHashes("ALICE", ["aced120", "aced120", "aced120", "aced120"]),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitValues("ALICE", null),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitValues("ALICE", "101"),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitValues("ALICE", []),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitValues("ALICE", ["001", "111"]),
			e => e === "WRONG_ARITY"
		)
		assert.throws(
			() => s.submitValues("ALICE", ["000", "101", "110", "111"]),
			e => e === "WRONG_ARITY"
		)
	})

	it("checks for value integrity", () => {
		const s = new ConcertedRandomiser(1, ["ALICE", "BOB"])
		const alice = random()
		const evil = random()
		s.submitHashes("ALICE", [alice.hash])
		assert.throws(
			() => s.submitValues("ALICE", [evil.value]),
			e => e === "HASH_VALUE_MISMATCH"
		)

		const bob = random()
		s.submitValues("BOB", [bob.value])
		assert.throws(
			() => s.submitHashes("BOB", [evil.hash]),
			e => e === "HASH_VALUE_MISMATCH"
		)
	})

	it("returns result when data is complete", () => {
		const s = new ConcertedRandomiser(2, ["ALICE", "BOB"])
		s.submitHashes("ALICE", [
			"fbd0ed2087be3dafb52fd873c8a30a83cdd347c173c752b9fb31897f07ebc76d",
			"deab94ad3fef33bfac696c5fa5a507044d8ae4138d07a96618caf990f5fba66c"
		])
		s.submitValues("ALICE", ["6b2df804", "02713fef"])
		s.submitHashes("BOB", [
			"5f53131e72425adfb6a007f61309deeb11ccfa06f0156703079c855e995bd71b",
			"b736994617eb6d9a573342120f383686447dad1688fb25838dc674ca29b83687"
		])
		s.submitValues("BOB", ["7d6d2b55", "bc0150fb"])
		assert.deepStrictEqual(s.retrieveNumbers(), [373347153, -1099927788])
	})
})

describe("[Randomiser] random()", () => {
	it("generates bit sequences as string of specified length", () => {
		const r = random()
		assert.strictEqual(r.hash.length, 64)
		assert.strictEqual(/^[a-f0-9]*$/.test(r.hash), true)
		assert.strictEqual(r.value.length, VALUE_STRING_LENGTH)
		assert.strictEqual(/^[a-f0-9]*$/.test(r.value), true)
	})

	it("yields different outputs every time", () => {
		assert.notDeepStrictEqual(random(), random())
	})
})

describe.skip("[Randomiser] Integration test", () => {
	//
	//	Test to check the distribution of resulting values
	//  Leave skipped, because it’s slow
	//

	const { dice } = require("./hash")

	it("distributes the value evenly across the spectrum", () => {
		const result = {}
		for (let i=0; i<9999; i++) {
			const participants = ["ALICE", "BOB"]
			const cr = new ConcertedRandomiser(1, participants)
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
	})
})
