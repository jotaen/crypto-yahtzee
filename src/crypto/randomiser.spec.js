const assert = require("assert")
const { flow } = require("../lib/redux")
const { isHash, isHexString } = require("./hash")
const { isComplete, retrieveNumbers, process, random, init } = require("./randomiser")

describe("[Randomiser] Generation", () => {
	it("calculates a random value based on the values of every player", () => {
		const alice = [random(), random(), random(), random(), random()]
		const bob = [random(), random(), random(), random(), random()]
		const chris = [random(), random(), random(), random(), random()]

		flow(init(5, ["ALICE", "BOB", "CHRIS"]))
			.then(s => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: alice.map(r => r.hash) }))
			.then(s => process(s, { type: "SEED_HASHES", player: "BOB", hashes: bob.map(r => r.hash) }))
			.then(s => process(s, { type: "SEED_HASHES", player: "CHRIS", hashes: chris.map(r => r.hash) }))
			.then(s => process(s, { type: "SEED_VALUES", player: "ALICE", values: alice.map(r => r.value) }))
			.then(s => process(s, { type: "SEED_VALUES", player: "BOB", values: bob.map(r => r.value) }))
			.peak(s => assert.strictEqual(isComplete(s), false))
			.then(s => process(s, { type: "SEED_VALUES", player: "CHRIS", values: chris.map(r => r.value) }))
			.peak(s => assert.strictEqual(isComplete(s), true))
			.peak(s => assert.strictEqual(retrieveNumbers(s).length, 5))
			.peak(s => assert.strictEqual(retrieveNumbers(s).every(n => Number.isInteger(n)), true))

		flow(init(2, ["ALICE", "BOB"]))
			.then(s => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: [
				"fbd0ed2087be3dafb52fd873c8a30a83cdd347c173c752b9fb31897f07ebc76d",
				"deab94ad3fef33bfac696c5fa5a507044d8ae4138d07a96618caf990f5fba66c"
			] }))
			.then(s => process(s, { type: "SEED_HASHES", player: "BOB", hashes: [
				"5f53131e72425adfb6a007f61309deeb11ccfa06f0156703079c855e995bd71b",
				"b736994617eb6d9a573342120f383686447dad1688fb25838dc674ca29b83687"
			] }))
			.then(s => process(s, { type: "SEED_VALUES", player: "ALICE", values: ["6b2df804", "02713fef"] }))
			.peak(s => assert.strictEqual(isComplete(s), false))
			.then(s => process(s, { type: "SEED_VALUES", player: "BOB", values: ["7d6d2b55", "bc0150fb"] }))
			.peak(s => assert.strictEqual(isComplete(s), true))
			.peak(s => assert.deepStrictEqual(retrieveNumbers(s), [373347153, -1099927788]))
	})

	it("cannot overwrite values", () => {
		const alice = random()
		flow(init(1, ["ALICE"]))
			.then(s => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: [alice.hash] }))
			.then(s => process(s, { type: "SEED_VALUES", player: "ALICE", values: [alice.value] }))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] }),
				e => e === "ALREADY_SUBMITTED"
			))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
				e => e === "ALREADY_SUBMITTED"
			))
	})

	it("rejects formally incorrect values/types", () => {
		flow(init(3, ["ALICE"]))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: ["", "!*&^TGAIS*F&", 2127] }),
				e => e === "BAD_ACTION"
			))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_VALUES", player: "ALICE", values: ["", "*&T@*&UR!SFS", 5123] }),
				e => e === "BAD_ACTION"
			))
	})

	it("cannot submit data for non-participant", () => {
		flow(init(2, ["ALICE"]))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_HASHES", player: "A*&FS^&A*G", hashes: [random().hash, random().hash] }),
				e => e === "NOT_PARTICIPANT"
			))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_VALUES", player: "A*&FS^&A*G", values: [random().value, random().value] }),
				e => e === "NOT_PARTICIPANT"
			))
	})

	it("collects hashes before values", () => {
		flow(init(1, ["ALICE", "BOB"]))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
				e => e === "HASHES_NOT_COMPLETE_YET"
			))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_VALUES", player: "BOB", values: [random().value] }),
				e => e === "HASHES_NOT_COMPLETE_YET"
			))
			.then(s => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] }))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
				e => e === "HASHES_NOT_COMPLETE_YET"
			))
	})

	it("rejects adding hashes/values with wrong type/arity", () => {
		const s0 = init(1, ["ALICE"])
		const s = process(s0, { type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] })

		;[
			[],
			[random().hash, random().hash],
			[random().hash, random().hash, random().hash, random().hash],
		].forEach(t => assert.throws(
			() => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: t }),
			e => e === "WRONG_ARITY"
		))

		;[
			[],
			[random().value, random().value],
			[random().value, random().value, random().value, random().value],
		].forEach(t => assert.throws(
			() => process(s, { type: "SEED_VALUES", player: "ALICE", values: t }),
			e => e === "WRONG_ARITY"
		))
	})

	it("checks for value integrity", () => {
		flow(init(1, ["ALICE"]))
			.then(s => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: [random().hash] }))
			.peak(s => assert.throws(
				() => process(s, { type: "SEED_VALUES", player: "ALICE", values: [random().value] }),
				e => e === "HASH_VALUE_MISMATCH"
			))
	})

	it("doesn’t return result when input is not complete", () => {
		const alice = random()
		const bob = random()
		flow(init(1, ["ALICE", "BOB"]))
			.then(s => process(s, { type: "SEED_HASHES", player: "ALICE", hashes: [alice.hash] }))
			.then(s => process(s, { type: "SEED_HASHES", player: "BOB", hashes: [bob.hash] }))
			.then(s => process(s, { type: "SEED_VALUES", player: "ALICE", values: [alice.value] }))
			.peak(s => assert.throws(
				() => retrieveNumbers(s),
				e => e === "INPUT_NOT_COMPLETE_YET"
			))
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
