const assert = require("assert")
const { Game } = require("./game")

describe("Game initialisation", () => {
	it("should setup initial state", () => {
		const g = new Game(["A", "B"])
		assert.deepStrictEqual(g.state(), {
			onTurn: 0,
			roll: 0,
			dices: null,
			scoreCards: [
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
