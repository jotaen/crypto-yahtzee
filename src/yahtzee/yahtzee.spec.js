const assert = require("assert")
const { Yahtzee } = require("./yahtzee")

describe("[Yahtzee] Initialisation", () => {
	it("creates empty scorecards for everyone", () => {
		const y = new Yahtzee(["joe", "lisa", "mike"])
		const emptycard = Object.freeze({ aces: null, twos: null, threes: null, fours: null, fives: null,
			sixes: null, threeOfAKind: null, fourOfAKind: null, fullHouse: null,
			smallStraight: null, largeStraight: null, yahtzee: null, chance: null
		})
		assert.deepStrictEqual(y.scorecard("joe"), emptycard)
		assert.deepStrictEqual(y.scorecard("lisa"), emptycard)
		assert.deepStrictEqual(y.scorecard("mike"), emptycard)
	})
})

describe("[Yahtzee] Selecting", () => {
	it("rejects selecting on first attempt", () => {
		const y = new Yahtzee(["joe", "lisa"])

		assert.throws(
			() => y.dispatch({ type: "SELECT", player: "joe", dices: [null, null, null, null, null] }),
			e => e === "ALREADY_SELECTED"
		)
	})

	it("rejects invalid selections", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 4, 1, 5, 6] })

		;[
			[], // none
			[2, 4, 1, 5, 6], // no `null`
			[1, 2, null, null], // to few
			[2, 4, 1, 5, null, null], // to many
			[1, 2, 5, "6", undefined], // wrong types
			[1, 2, 5, {}, true] // nonsense values
		].forEach(ds => {
			assert.throws(
				() => y.dispatch({ type: "SELECT", player: "joe", dices: ds }), 
				e => e === "BAD_ACTION"
			)
		})
	})

	it("rejects incompatible selections (e.g. with made-up values)", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 4, 1, 5, 6] })

		;[
			[6, 6, null, null, null],
			[null, 3, null, null, null],
			[2, 4, 1, 1, null],
		].forEach(ds => {
			assert.throws(
				() => y.dispatch({ type: "SELECT", player: "joe", dices: ds }), 
				e => e === "INCOMPATIBLE_SELECTION"
			)
		})
	})
})

describe("[Yahtzee] Rolling", () => {
	it("takes over the rolls of a player", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 4, 1, 5, 6] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [6, null, null, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [3, 5, 6, 1] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [6, null, 6, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [1, 6, 2] })
		y.dispatch({ type: "RECORD", player: "joe", category: "sixes" })
		assert.strictEqual(y.scorecard("joe").sixes, 18)
	})

	it("rejects a roll if no dices have been selected (except first attempt)", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 5, 4, 2, 3] })
		assert.throws(
			() => y.dispatch({ type: "ROLL", player: "joe", dices: [6, 6, 6, 6, 6] }),
			e => e === "NO_DICES_SELECTED"
		)
	})

	it("rejects rolling more|less dices than have been selected", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 4, 1, 5, 6] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [2, 4, null, 5, null] })
		assert.throws(
			() => y.dispatch({ type: "ROLL", player: "joe", dices: [5, 5, 5] }),
			e => e === "INVALID_ROLL"
		)
		assert.throws(
			() => y.dispatch({ type: "ROLL", player: "joe", dices: [5] }),
			e => e === "INVALID_ROLL"
		)
	})

	it("rejects invalid rolls", () => {
		const y = new Yahtzee(["joe", "lisa"])

		;[
			[], // none
			[2, 4, 1, 5, 6, 3], // to many
			[7, -9, 0, 11, -3], // out of range
			[1, 2, 3, 4, "5"], // wrong types
			[2, 4, 5, {}, false] // nonsense values
		].forEach(ds => {
			assert.throws(
				() => y.dispatch({ type: "ROLL", player: "joe", dices: ds }), 
				e => e === "BAD_ACTION"
			)
		})
	})
})

describe("[Yahtzee] Recording", () => {
	it("scores dices for individual players", () => {
		const y = new Yahtzee(["joe", "lisa"])
			// player 0:
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 5, 3, 2, 2] })
		y.dispatch({ type: "RECORD", player: "joe", category: "twos" })
		assert.strictEqual(y.scorecard("joe").twos, 6)
			// player 1:
		y.dispatch({ type: "ROLL", player: "lisa", dices: [1, 2, 3, 4, 5] })
		y.dispatch({ type: "RECORD", player: "lisa", category: "largeStraight" })
		assert.strictEqual(y.scorecard("lisa").largeStraight, 40)
	})

	it("can cross out", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 5, 3, 2, 2] })
		y.dispatch({ type: "RECORD", player: "joe", category: "yahtzee" })
		assert.strictEqual(y.scorecard("joe").yahtzee, 0)
	})

	it("cannot overwrite existing scores", () => {
		const y = new Yahtzee(["joe"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 4, 4, 4, 1] })
		y.dispatch({ type: "RECORD", player: "joe", category: "threeOfAKind" })
		y.dispatch({ type: "ROLL", player: "joe", dices: [6, 6, 6, 2, 5] })
		assert.throws(
			() => y.dispatch({ type: "RECORD", player: "joe", category: "threeOfAKind" }),
			e => e === "CATEGORY_ALREADY_RECORDED"
		)
	})

	it("cannot score without having rolled", () => {
		const y = new Yahtzee(["joe", "lisa"])
		assert.throws(
			() => y.dispatch({ type: "RECORD", player: "joe", category: "threeOfAKind" }),
			e => e === "NO_DICES_ROLLED"
		)
	})

	it("rejects invalid categories", () => {
		const y = new Yahtzee(["joe", "lisa", "mike"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 4, 4, 4, 1] })
		assert.throws(
			() => y.dispatch({ type: "RECORD", player: "joe", category: "alshfygfjhashjf" }),
			e => e === "BAD_ACTION"
		)
	})
})

describe("[Yahtzee] Taking turns", () => {
	it("doesn’t allow actions of a player when they are not on turn", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [1, 4, 1, 5, 6] })
		assert.throws(
			() => y.dispatch({ type: "RECORD", player: "lisa", category: "chance" }),
			e => e === "NOT_ON_TURN"
		)
		assert.throws(
			() => y.dispatch({ type: "ROLL", player: "qoiweufhajsduwhihas", dices: [1, 4, 1, 5, 6] }),
			e => e === "NOT_ON_TURN"
		)
		y.dispatch({ type: "RECORD", player: "joe", category: "chance" })
		assert.throws(
			() => y.dispatch({ type: "ROLL", player: "joe", dices: [1, 4, 1, 5, 6] }),
			e => e === "NOT_ON_TURN"
		)
	})

	it("cannot attempt more than three times", () => {
		const y = new Yahtzee(["joe", "lisa"])

		y.dispatch({ type: "ROLL", player: "joe", dices: [1, 4, 1, 5, 6] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [5, null, null, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [5, 2, 3, 1] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [5, 5, null, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [3, 5, 1] })

		assert.throws(
			() => y.dispatch({ type: "SELECT", player: "joe", dices: [5, 5, 5, null, null] }),
			e => e === "ROLLS_EXCEEDED"
		)
	})
})

describe("[Yahtzee] Integration test", () => {
	it("works across a whole series of actions", () => {
		const y = new Yahtzee(["joe", "lisa"])
		y.dispatch({ type: "ROLL", player: "joe", dices: [1, 4, 1, 5, 6] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [5, null, null, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [5, 2, 3, 1] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [5, 5, null, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [3, 5, 1] })
		y.dispatch({ type: "RECORD", player: "joe", category: "fives" })
		y.dispatch({ type: "ROLL", player: "lisa", dices: [1, 2, 3, 4, 5] })
		y.dispatch({ type: "RECORD", player: "lisa", category: "largeStraight" })
		y.dispatch({ type: "ROLL", player: "joe", dices: [4, 4, 2, 3, 1] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [4, 4, null, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [1, 1, 2] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [1, 2, 4, null, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [3, 4] })
		y.dispatch({ type: "RECORD", player: "joe", category: "smallStraight" })
		y.dispatch({ type: "ROLL", player: "lisa", dices: [6, 5, 6, 2, 2] })
		y.dispatch({ type: "SELECT", player: "lisa", dices: [null, null, 6, 6, null] })
		y.dispatch({ type: "ROLL", player: "lisa", dices: [3, 6, 5] })
		y.dispatch({ type: "SELECT", player: "lisa", dices: [null, null, 6, 6, 6] })
		y.dispatch({ type: "ROLL", player: "lisa", dices: [3, 3] })
		y.dispatch({ type: "RECORD", player: "lisa", category: "fullHouse" })
		y.dispatch({ type: "ROLL", player: "joe", dices: [2, 2, 2, 2, 5] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [2, 2, 2, 2, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [3] })
		y.dispatch({ type: "SELECT", player: "joe", dices: [2, 2, 2, 2, null] })
		y.dispatch({ type: "ROLL", player: "joe", dices: [2] })
		y.dispatch({ type: "RECORD", player: "joe", category: "yahtzee" })
		// to be continued… 🤪
		
		assert.deepStrictEqual(y.scorecard("joe"), {
			aces: null, twos: null, threes: null, fours: null, fives: 15,
			sixes: null, threeOfAKind: null, fourOfAKind: null, fullHouse: null,
			smallStraight: 30, largeStraight: null, yahtzee: 50, chance: null
		})
		assert.deepStrictEqual(y.scorecard("lisa"), {
			aces: null, twos: null, threes: null, fours: null, fives: null,
			sixes: null, threeOfAKind: null, fourOfAKind: null, fullHouse: 25,
			smallStraight: null, largeStraight: 40, yahtzee: null, chance: null
		})
	})
})
