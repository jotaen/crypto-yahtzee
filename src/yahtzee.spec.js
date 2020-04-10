const assert = require("assert")
const { createState, roll, record } = require("./yahtzee")

describe("[Yahtzee] Initialisation", () => {
	it("creates empty default state", () => {
		const s = createState(3)
		assert.deepStrictEqual(s, {
			onTurn: 0,
			roll: 0,
			dices: null,
			scorecards: [
				{ aces: null, twos: null, threes: null, fours: null, fives: null,
					sixes: null, threeOfAKind: null, fourOfAKind: null, fullHouse: null,
					smallStraight: null, largeStraight: null, yahtzee: null, chance: null },
				{ aces: null, twos: null, threes: null, fours: null, fives: null,
					sixes: null, threeOfAKind: null, fourOfAKind: null, fullHouse: null,
					smallStraight: null, largeStraight: null, yahtzee: null, chance: null },
				{ aces: null, twos: null, threes: null, fours: null, fives: null,
					sixes: null, threeOfAKind: null, fourOfAKind: null, fullHouse: null,
					smallStraight: null, largeStraight: null, yahtzee: null, chance: null },
			]
		})
	})
})

describe("[Yahtzee] Rolling", () => {
	it("commits roll of player", () => {
		const s1 = createState(2)
		const s2 = roll(s1, { dices: [2, 4, 1, 5, 6] })
		assert.strictEqual(s2.roll, 1)
		assert.deepStrictEqual(s2.dices, [2, 4, 1, 5, 6])
	})

	it("accepts not more than 3 rolls", () => {
		const s1 = createState(2)
		const s2 = roll(s1, { dices: [2, 4, 1, 5, 6] })
		const s3 = roll(s2, { dices: [2, 4, 1, 5, 6] })
		const s4 = roll(s3, { dices: [2, 4, 1, 5, 6] })
		assert.throws(
			() => roll(s4, { dices: [2, 4, 1, 5, 6] }),
			e => e === "ROLLS_EXCEEDED"
		)
	})

	it("rejects invalid dices", () => {
		const s = createState(2)
		assert.throws(
			() => roll(s, { dices: [] }), // none
			e => e === "INVALID_DICES"
		)
		assert.throws(
			() => roll(s, { dices: [1, 2, 3] }), // to few
			e => e === "INVALID_DICES"
		)
		assert.throws(
			() => roll(s, { dices: [2, 4, 1, 5, 6, 1, 4] }), // to many
			e => e === "INVALID_DICES"
		)
		assert.throws(
			() => roll(s, { dices: [7, 9, 0, 11, -3] }), // wrong value
			e => e === "INVALID_DICES"
		)
		assert.throws(
			() => roll(s, { dices: ["foo", true] }), // wrong type
			e => e === "INVALID_DICES"
		)
	})
})

describe("[Yahtzee] Scoring", () => {
	it("scores dices", () => {
		const s1 = createState(2)
		const s2 = roll(s1, { dices: [2, 5, 3, 2, 2] })
		const s3 = record(s2, { category: "twos" })
		assert.strictEqual(s3.scorecards[0].twos, 6)
	})

	it("can cross out", () => {
		const s1 = createState(2)
		const s2 = roll(s1, { dices: [2, 5, 3, 2, 2] })
		const s3 = record(s2, { category: "yahtzee" })
		assert.strictEqual(s3.scorecards[0].yahtzee, 0)
	})

	it("cannot overwrite existing scores", () => {
		const s1 = createState(3)
		s1.scorecards[s1.onTurn].threeOfAKind = 21
		const s2 = roll(s1, { dices: [2, 4, 4, 4, 1] })
		assert.throws(
			() => record(s2, { category: "threeOfAKind" }),
			e => e === "CATEGORY_ALREADY_RECORDED"
		)
	})
})
