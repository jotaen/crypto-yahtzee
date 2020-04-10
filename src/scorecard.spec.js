const assert = require("assert")
const { createScorecard, count } = require("./scorecard")

describe("[Scorecard] Calculation", () => {
	it("counts aces", () => {
		assert.strictEqual(count([4, 2, 5, 5, 2]).aces, 0)
		assert.strictEqual(count([1, 2, 1, 5, 1]).aces, 3)
	})

	it("counts twos", () => {
		assert.strictEqual(count([1, 4, 1, 6, 4]).twos, 0)
		assert.strictEqual(count([2, 2, 1, 5, 4]).twos, 4)
	})

	it("counts threes", () => {
		assert.strictEqual(count([4, 5, 1, 1, 4]).threes, 0)
		assert.strictEqual(count([3, 6, 6, 3, 2]).threes, 6)
		
	})

	it("counts fours", () => {
		assert.strictEqual(count([1, 1, 1, 1, 1]).fours, 0)
		assert.strictEqual(count([4, 6, 3, 1, 1]).fours, 4)
		
	})

	it("counts fives", () => {
		assert.strictEqual(count([4, 2, 2, 6, 1]).fives, 0)
		assert.strictEqual(count([6, 1, 5, 5, 5]).fives, 15)
		
	})

	it("counts sixes", () => {
		assert.strictEqual(count([2, 3, 4, 5, 1]).sixes, 0)
		assert.strictEqual(count([6, 6, 6, 6, 6]).sixes, 30)
	})

	it("counts three of a kind", () => {
		assert.strictEqual(count([1, 3, 1, 6, 2]).threeOfAKind, 0)
		assert.strictEqual(count([3, 3, 4, 5, 1]).threeOfAKind, 0)
		assert.strictEqual(count([6, 6, 6, 2, 3]).threeOfAKind, 23)
		assert.strictEqual(count([2, 2, 1, 2, 2]).threeOfAKind, 9)
	})

	it("counts four of a kind", () => {
		assert.strictEqual(count([6, 5, 4, 3, 2]).fourOfAKind, 0)
		assert.strictEqual(count([4, 4, 4, 1, 1]).fourOfAKind, 0)
		assert.strictEqual(count([2, 5, 5, 5, 5]).fourOfAKind, 22)
		assert.strictEqual(count([3, 3, 3, 3, 3]).fourOfAKind, 15)
	})

	it("counts full house", () => {
		assert.strictEqual(count([5, 5, 5, 5, 5]).fullHouse, 0)
		assert.strictEqual(count([1, 2, 1, 1, 3]).fullHouse, 0)
		assert.strictEqual(count([3, 3, 6, 6, 6]).fullHouse, 25)
		assert.strictEqual(count([2, 1, 2, 1, 2]).fullHouse, 25)
	})

	it("counts small straight", () => {
		assert.strictEqual(count([1, 2, 2, 2, 1]).smallStraight, 0)
		assert.strictEqual(count([1, 2, 3, 5, 6]).smallStraight, 0)
		assert.strictEqual(count([1, 2, 3, 4, 6]).smallStraight, 30)
		assert.strictEqual(count([1, 3, 5, 4, 6]).smallStraight, 30)
		assert.strictEqual(count([3, 5, 2, 6, 4]).smallStraight, 30)
	})

	it("counts large straight", () => {
		assert.strictEqual(count([3, 2, 3, 3, 3]).largeStraight, 0)
		assert.strictEqual(count([2, 3, 5, 6, 1]).largeStraight, 0)
		assert.strictEqual(count([1, 2, 3, 4, 6]).largeStraight, 0)
		assert.strictEqual(count([1, 2, 3, 4, 5]).largeStraight, 40)
		assert.strictEqual(count([2, 4, 5, 6, 3]).largeStraight, 40)
	})

	it("counts yahtzee", () => {
		assert.strictEqual(count([4, 4, 4, 4, 3]).yahtzee, 0)
		assert.strictEqual(count([1, 1, 1, 1, 1]).yahtzee, 50)
		assert.strictEqual(count([6, 6, 6, 6, 6]).yahtzee, 50)
	})

	it("counts chance", () => {
		assert.strictEqual(count([2, 1, 5, 1, 2]).chance, 11)
		assert.strictEqual(count([1, 1, 1, 1, 1]).chance, 5)
		assert.strictEqual(count([6, 3, 3, 3, 5]).chance, 20)
	})
})
