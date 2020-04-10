const { createScorecard, count } = require("./scorecard")

const deepClone = obj => JSON.parse(JSON.stringify(obj))

module.exports.createState = (numberOfPlayers) => ({
	onTurn: 0,
	roll: 0,
	dices: null,
	scorecards: Array.from(Array(numberOfPlayers)).map(createScorecard),
})

module.exports.roll = (state, { player, dices }) => {
	if (state.roll >= 3) {
		throw "ROLLS_EXCEEDED"
	}
	if (dices.length!==5 || dices.some(d => ![1, 2, 3, 4, 5, 6].includes(d))) {
		throw "INVALID_DICES"
	}
	return { ...state, roll: state.roll+1, dices: dices }
}

module.exports.record = (state, { dices, category }) => {
	const scorecard = state.scorecards[state.onTurn]
	if (scorecard[category] !== null) {
		throw "CATEGORY_ALREADY_RECORDED"
	}
	const potentialScores = count(state.dices)
	const newState = deepClone(state)
	newState.scorecards[state.onTurn][category] = potentialScores[category]
	return newState
}
