const assert = require("assert")
const { createGame, roll, record } = require("./game")

const flow = game => ({
	then: fn => flow(fn(game)),
	peak: fn => { fn(game); return flow(game); }
})

describe("[Game] Initialisation", () => {
	it("creates empty default state", () => {
		const s = createGame(3)
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

describe("[Game] Rolling", () => {
	it("commits roll of player", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [2, 4, 1, 5, 6] }))
			.peak(s => {
				assert.strictEqual(s.roll, 1)
				assert.deepStrictEqual(s.dices, [2, 4, 1, 5, 6])
			})
	})

	it("rejects invalid dices", () => {
		const s = createGame(2)
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

describe("[Game] Scoring", () => {
	it("scores dices for individual players", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [2, 5, 3, 2, 2] }))
			.then(s => record(s, { category: "twos" }))
			.peak(s => assert.strictEqual(s.scorecards[0].twos, 6))
			.then(s => roll(s, { dices: [1, 2, 3, 4, 5] }))
			.then(s => record(s, { category: "largeStraight" }))
			.peak(s => assert.strictEqual(s.scorecards[1].largeStraight, 40))
	})

	it("can cross out", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [2, 5, 3, 2, 2] }))
			.then(s => record(s, { category: "yahtzee" }))
			.peak(s => assert.strictEqual(s.scorecards[0].yahtzee, 0))		
	})

	it("cannot overwrite existing scores", () => {
		flow(createGame(3))
			.then(s => {
				s.scorecards[s.onTurn].threeOfAKind = 21
				return s
			})
			.then(s => roll(s, { dices: [2, 4, 4, 4, 1] }))
			.peak(s => {
				assert.throws(
					() => record(s, { category: "threeOfAKind" }),
					e => e === "CATEGORY_ALREADY_RECORDED"
				)
			})
	})
})

describe("[Game] Game play", () => {
	it("can roll no more than three times", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [2, 4, 1, 5, 6] }))
			.then(s => roll(s, { dices: [2, 4, 1, 5, 6] }))
			.then(s => roll(s, { dices: [2, 4, 1, 5, 6] }))
			.peak(s => {
				assert.throws(
					() => roll(s, { dices: [2, 4, 1, 5, 6] }),
					e => e === "ROLLS_EXCEEDED"
				)
			})
	})

	it("cannot score without dices", () => {
		const s = createGame(2)
		assert.throws(
			() => record(s, { category: "threeOfAKind" }),
			e => e === "NO_DICES_ROLLED"
		)
	})

	it("advances to next player after record", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [3, 3, 2, 1, 2] }))
			.then(s => record(s, { category: "threes" }))
			.peak(s => {
				assert.strictEqual(s.onTurn, 1)
				assert.strictEqual(s.dices, null)
				assert.strictEqual(s.roll, 0)
			})
			.then(s => roll(s, { dices: [1, 1, 6, 1, 4] }))
			.then(s => record(s, { category: "aces" }))
			.peak(s => assert.strictEqual(s.onTurn, 0))
	})

	it("indicates finished game when scorecards are full", () => {
		flow(createGame(1))
			.then(s => {
				s.scorecards[0] = { aces: 1, twos: 2, threes: 3, fours: 4, fives: 5,
					sixes: 6, threeOfAKind: 10, fourOfAKind: 20, fullHouse: 25,
					smallStraight: 30, largeStraight: 40, yahtzee: 50, chance: null }
				return s
			})
			.then(s => roll(s, { dices: [3, 3, 2, 1, 2] }))
			.then(s => record(s, { category: "chance" }))
			.peak(s => {
				assert.strictEqual(s.onTurn, null)
			})
	})
})
