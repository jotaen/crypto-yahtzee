const assert = require("assert")
const { isHash, isHexString } = require("./hash")
const { ConcertedRandomiser, random } = require("./randomiser")

describe("[Randomiser] Generation", () => {
	it("calculates a random value based on the values of every player", () => {
		const s = new ConcertedRandomiser(5, ["ALICE", "BOB", "CHRIS"])
		const alice = [random(), random(), random(), random(), random()]
		const bob = [random(), random(), random(), random(), random()]
		const chris = [random(), random(), random(), random(), random()]

		s.submitHashes("ALICE", alice.map(r => r.hash))
		s.submitHashes("BOB", bob.map(r => r.hash))
		s.submitHashes("CHRIS", chris.map(r => r.hash))

		s.submitValues("ALICE", alice.map(r => r.value))
		s.submitValues("BOB", bob.map(r => r.value))
		s.submitValues("CHRIS", chris.map(r => r.value))

		assert.strictEqual(s.retrieveNumbers().length, 5)
		assert.strictEqual(s.retrieveNumbers().every(n => Number.isInteger(n)), true)
	})

	it("returns result when data is complete", () => {
		const s = new ConcertedRandomiser(2, ["ALICE", "BOB"])
		s.submitHashes("ALICE", [
			"fbd0ed2087be3dafb52fd873c8a30a83cdd347c173c752b9fb31897f07ebc76d",
			"deab94ad3fef33bfac696c5fa5a507044d8ae4138d07a96618caf990f5fba66c"
		])
		s.submitHashes("BOB", [
			"5f53131e72425adfb6a007f61309deeb11ccfa06f0156703079c855e995bd71b",
			"b736994617eb6d9a573342120f383686447dad1688fb25838dc674ca29b83687"
		])
		s.submitValues("ALICE", ["6b2df804", "02713fef"])
		s.submitValues("BOB", ["7d6d2b55", "bc0150fb"])
		assert.deepStrictEqual(s.retrieveNumbers(), [373347153, -1099927788])
	})

	it("cannot overwrite values", () => {
		const s = new ConcertedRandomiser(1, ["ALICE"])
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
		const s = new ConcertedRandomiser(3, ["ALICE"])
		assert.throws(
			() => s.submitHashes("ALICE", ["", "!*&^TGAIS*F&", 2127]),
			e => e === "MALFORMED_VALUE"
		)
		s.submitHashes("ALICE", [random().hash, random().hash, random().hash])
		assert.throws(
			() => s.submitValues("ALICE", ["", "*&T@*&UR!SFS", 5123]),
			e => e === "MALFORMED_VALUE"
		)
	})

	it("cannot submit data for non-participant", () => {
		const s = new ConcertedRandomiser(2, ["ALICE"])
		assert.throws(
			() => s.submitHashes("MALICIOUS", [random().hash, random().hash]),
			e => e === "NOT_PARTICIPANT"
		)
		s.submitHashes("ALICE", [random().hash, random().hash])
		assert.throws(
			() => s.submitValues("MALICIOUS", [random().value, random().value]),
			e => e === "NOT_PARTICIPANT"
		)
	})

	it("collects hashes before values", () => {
		const s = new ConcertedRandomiser(2, ["ALICE", "BOB", "CHRIS"])
		assert.throws(
			() => s.submitValues("ALICE", [random().value, random().value]),
			e => e === "NO_HASH_SUBMITTED_YET"
		)
	})

	it("rejects adding hashes/values with wrong type/arity", () => {
		const s = new ConcertedRandomiser(3, ["ALICE"])
		s.submitHashes("ALICE", [random().hash, random().hash, random().hash])

		;[
			null,
			"aced120",
			[],
			["aced120", "aced120"],
			["aced120", "aced120", "aced120", "aced120"],
		].forEach(t => {
			assert.throws(
				() => s.submitHashes("ALICE", t),
				e => e === "WRONG_ARITY"
			)
			assert.throws(
				() => s.submitValues("ALICE", t),
				e => e === "WRONG_ARITY"
			)
		})
	})

	it("checks for value integrity", () => {
		const s = new ConcertedRandomiser(1, ["ALICE"])
		const alice = random()
		const evil = random()
		s.submitHashes("ALICE", [alice.hash])
		assert.throws(
			() => s.submitValues("ALICE", [evil.value]),
			e => e === "HASH_VALUE_MISMATCH"
		)
	})

	it("only returns result when inputs are complete", () => {
		const s = new ConcertedRandomiser(1, ["ALICE", "BOB"])
		const alice = random()
		const bob = random()
		s.submitHashes("ALICE", [alice.hash])
		s.submitHashes("BOB", [bob.hash])
		s.submitValues("ALICE", [alice.value])
		assert.strictEqual(s.isComplete(), false)
		assert.throws(
			() => s.retrieveNumbers(),
			e => e === "INPUT_NOT_COMPLETE_YET"
		)

		s.submitValues("BOB", [bob.value])
		assert.strictEqual(s.isComplete(), true)
	})
})

describe("[Randomiser] random()", () => {
	it("generates bit sequences as string of specified length", () => {
		const r = random()
		assert.strictEqual(isHash(r.hash), true)
		assert.strictEqual(isHexString(8)(r.value), true)
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
		const iterations = 99999
		for (let i=0; i<iterations; i++) {
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
		const distribution = Object.values(result).sort((a,b) => a-b)
		const min = distribution[0]
		const max = distribution[distribution.length-1]

		// due to random values, this assertation is allowed to fail occasionally
		assert.strictEqual((max-min)/max < 0.05, true)
	})
})
