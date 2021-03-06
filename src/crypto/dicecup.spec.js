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
				"ce57d8bc990447c7ec35557040756db2a9ff7cdab53911f3c7995bc6bf3572cda8c94fa53789e523a680de9921c067f6717e79426df467185fc7a6dbec4b2d57",
				"18a39bace4ebdec63affbe4987b3f5b5e05a18fc960c37dee862a8eadbda0af7a43052c2b4c9318b529b28dd0f1a524226b7ab442056dcdf1188bba89ffd4fbd"
			], hashes: [
				"c2d1d16431aa507c2fe15545b56de3b8745eb4f9c812c6d268d37cc57dc36b82422ccb6c753fccbcab6532f54645993c64df9fe44f0117f84077266ea4db589f",
				"1619d14465b4e5f0ffc6793ab4a9898e349f10bd01069f0cb302fe52cdd06af6d7978a62d1fef9a89d4afb72343f36de89b65af7c229233a73a0fe6348dd118f",
			] })
		dc.dispatch({ type: "DICECUP_HASHES", player: "BOB", seeds: [
				"f553217802b20f0668d4ee78a8761aa01ed4326ca45a69a9a4cec9759eb0c771c170a70220ecbda00dc5fe581894313933054eddc95a0ef339b0206fefa4273a",
				"817f416f45a2fa35d4a2754a172938be74a361a4ba8cfb108fed05898a6f1cc3e3ac655abc95ecc7e7d5fd4238aa974f8f5f0e381d4e877b17f29c1a38c42ec7"
			], hashes: [
				"ca238711db9649c75a1c942c9e48e0edb2ab72c1a1bdd362db12a8dd0200849e4bf36cbcb94ab4e08a9919766b24296a57efbccb040575bf05c026b977e08d8d",
				"bb8b8d68b99425c660a2da6abd0789e025f858838707a7c2e2aaef2d26fa6cc424f56e65810e89625aaa79847d77770cc135a7d893ab987c3c22564e2ae7b9d7",
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
