const createScoreCard = () => ({
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
})

module.exports.createInitialState = (numberOfPlayers) => ({
	onTurn: 0,
	roll: 0,
	dices: null,
	scoreCards: Array.from(Array(numberOfPlayers)).map(createScoreCard),
})
