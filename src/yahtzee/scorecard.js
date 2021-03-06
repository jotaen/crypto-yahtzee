const createScorecard = initialValues => ({
	aces: null,
	twos: null,
	threes: null,
	fours: null,
	fives: null,
	sixes: null,
	threeOfAKind: null,
	fourOfAKind: null,
	fullHouse: null,
	smallStraight: null,
	largeStraight: null,
	yahtzee: null,
	chance: null,
	...initialValues,
})

const diceCounter = ds => ([
	{ val: 1, count: ds.filter(d => d===1).length },
	{ val: 2, count: ds.filter(d => d===2).length },
	{ val: 3, count: ds.filter(d => d===3).length },
	{ val: 4, count: ds.filter(d => d===4).length },
	{ val: 5, count: ds.filter(d => d===5).length },
	{ val: 6, count: ds.filter(d => d===6).length },
])

const sumAllValues = cs => cs.reduce((a, c) => a + c.count*c.val, 0)

const sumValue = (cs, val) => val * cs.find(c => c.val === val).count

const count = dices => {
	cs = diceCounter(dices)
	return {
		aces: sumValue(cs, 1),
		twos: sumValue(cs, 2),
		threes: sumValue(cs, 3),
		fours: sumValue(cs, 4),
		fives: sumValue(cs, 5),
		sixes: sumValue(cs, 6),
		threeOfAKind: cs.some(c => c.count >= 3) ? sumAllValues(cs) : 0,
		fourOfAKind: cs.some(c => c.count >= 4) ? sumAllValues(cs) : 0,
		fullHouse: cs.some(c => c.count === 2) && cs.some(c => c.count === 3) ? 25 : 0,
		smallStraight: cs.reduce((a, c) => a===4 ? a : (c.count===0 ? 0 : a+1), 0) === 4 ? 30 : 0,
		largeStraight: cs.reduce((a, c) => a===5 ? a : (c.count===0 ? 0 : a+1), 0) === 5 ? 40 : 0,
		yahtzee: cs.some(c => c.count === 5) ? 50 : 0,
		chance: sumAllValues(cs),
	}
}

const isFilledUp = sc => Object.values(sc).filter(s => s === null).length === 0

const UPPER_SECTION = ["aces", "twos", "threes", "fours", "fives", "sixes"]
const LOWER_SECTION = ["threeOfAKind", "fourOfAKind", "fullHouse", "smallStraight", "largeStraight", "yahtzee", "chance"]

const sum = sc => {
	const upperPoints = UPPER_SECTION.map(n => sc[n]).reduce((a, c) => a+c, 0)
	const bonus = upperPoints >= 63 ? 35 : 0
	const lowerTotal = LOWER_SECTION.map(n => sc[n]).reduce((a, c) => a + c, 0)
	const upperTotal = upperPoints + bonus
	const total = upperTotal + lowerTotal
	return { upperPoints, bonus, upperTotal, lowerTotal, total }
}

module.exports = {
	sum, isFilledUp, count, createScorecard, UPPER_SECTION, LOWER_SECTION
}
