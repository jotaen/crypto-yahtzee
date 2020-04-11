const assert = require("assert")
const { createGame, roll, record, select } = require("./game")

const flow = game => ({
	then: fn => flow(fn(game)),
	peak: fn => { fn(game); return flow(game); },
})

describe("[Game] Initialisation", () => {
	it("creates empty default state", () => {
		const s = createGame(3)
		assert.deepStrictEqual(s, {
			onTurn: 0,
			roll: 0,
			dices: [null, null, null, null, null],
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

describe("[Game] Selecting", () => {
	it("rejects selecting on first attempt", () => {
		const s = createGame(2)

		assert.throws(
			() => select(s, { dices: [null, null, null, null, null] }),
			e => e === "ALREADY_SELECTED"
		)
	})

	it("rejects invalid selections", () => {
		const s0 = createGame(2)
		const s = roll(s0, { dices: [2, 4, 1, 5, 6] })

		;[
			2, // wrong type
			[], // none
			[2, 4, 1, 5, 6], // no `null`
			[1, 2, null, null], // to few
			[2, 4, 1, 5, null, null], // to many
			[1, 2, 5, "6", undefined], // wrong types
			[1, 2, 5, {}, true] // nonsense values
		].forEach(ds => {
			assert.throws(
				() => select(s, { dices: ds }), 
				e => e === "INVALID_SELECTION"
			)
		})
	})

	it("rejects incompatible selections (e.g. with made-up values)", () => {
		const s0 = createGame(2)
		const s = roll(s0, { dices: [2, 4, 1, 5, 6] })

		;[
			[6, 6, null, null, null],
			[null, 3, null, null, null],
			[2, 4, 1, 1, null],
		].forEach(ds => {
			assert.throws(
				() => select(s, { dices: ds }), 
				e => e === "INCOMPATIBLE_SELECTION"
			)
		})
	})
})

describe("[Game] Rolling", () => {
	it("takes over the rolls of a player", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [2, 4, 1, 5, 6] }))
			.peak(s => {
				assert.strictEqual(s.roll, 1)
				assert.deepStrictEqual(s.dices, [1, 2, 4, 5, 6])
			})
			.then(s => select(s, { dices: [6, null, null, null, null] }))
			.then(s => roll(s, { dices: [3, 5, 6, 1] }))
			.peak(s => {
				assert.strictEqual(s.roll, 2)
				assert.deepStrictEqual(s.dices, [1, 3, 5, 6, 6])
			})
			.then(s => select(s, { dices: [6, null, 6, null, null] }))
			.then(s => roll(s, { dices: [1, 6, 2] }))
			.peak(s => {
				assert.strictEqual(s.roll, 3)
				assert.deepStrictEqual(s.dices, [1, 2, 6, 6, 6])
			})
	})

	it("rejects a roll if no dices have been selected (except first attempt)", () => {
		const s0 = createGame(2)
		const s = roll(s0, { dices: [2, 5, 4, 2, 3] })
		assert.throws(
			() => roll(s, { dices: [6, 6, 6, 6, 6] }),
			e => e === "NO_DICES_SELECTED"
		)
	})

	it("rejects rolling more|less dices than have been selected", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [2, 4, 1, 5, 6] }))
			.then(s => select(s, { dices: [2, 4, null, 5, null] }))
			.then(s => {
				assert.throws(
					() => roll(s, { dices: [5, 5, 5] }),
					e => e === "INVALID_ROLL"
				)
				assert.throws(
					() => roll(s, { dices: [5] }),
					e => e === "INVALID_ROLL"
				)
			})
	})

	it("rejects invalid rolls", () => {
		const s = createGame(2)

		;[
			2, // wrong type
			[], // none
			[1, 2, 3, 4], // to few
			[2, 4, 1, 5, 6, 3], // to many
			[7, -9, 0, 11, -3], // out of range
			[1, 2, 3, 4, "5"], // wrong types
			[2, 4, 5, {}, false] // nonsense values
		].forEach(ds => {
			assert.throws(
				() => roll(s, { dices: ds }), 
				e => e === "INVALID_ROLL"
			)
		})
	})
})

describe("[Game] Scoring", () => {
	it("scores dices for individual players", () => {
		flow(createGame(2))
			// player 0:
			.then(s => roll(s, { dices: [2, 5, 3, 2, 2] }))
			.then(s => record(s, { category: "twos" }))
			.peak(s => assert.strictEqual(s.scorecards[0].twos, 6))
			// player 1:
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

	it("cannot score without having rolled", () => {
		const s = createGame(2)
		assert.throws(
			() => record(s, { category: "threeOfAKind" }),
			e => e === "NO_DICES_ROLLED"
		)
	})
})

describe("[Game] Game play", () => {
	it("advances to next player after record and cleans up", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [3, 3, 2, 1, 2] }))
			.then(s => record(s, { category: "threes" }))
			.peak(s => {
				assert.strictEqual(s.onTurn, 1)
				assert.deepStrictEqual(s.dices, [null, null, null, null, null])
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
			.peak(s => {
				assert.throws(
					() => roll(s, { dices: [1, 5, 6, 6, 1] }),
					e => e === "GAME_FINISHED"
				)
			})
	})

	it("cannot attempt more than three times", () => {
		flow(createGame(2))
			.then(s => roll(s, { dices: [1, 4, 1, 5, 6] }))
			.then(s => select(s, { dices: [5, null, null, null, null] }))
			.then(s => roll(s, { dices: [5, 2, 3, 1] }))
			.then(s => select(s, { dices: [5, 5, null, null, null] }))
			.then(s => roll(s, { dices: [3, 5, 1] }))
			.peak(s => {
				assert.throws(
					() => select(s, { dices: [5, 5, 5, null, null] }),
					e => e === "ROLLS_EXCEEDED"
				)
			})
	})
})
