const { createScorecard, count, isFilledUp } = require("./scorecard")

const deepClone = obj => JSON.parse(JSON.stringify(obj))

module.exports.createGame = (numberOfPlayers) => ({
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

const advanceTurn = (state) => {
	const nextOnTurn = state.scorecards.length-1 === state.onTurn ? 0 : state.onTurn + 1
	return {
		...state,
		onTurn: isFilledUp(state.scorecards[nextOnTurn]) ? null : nextOnTurn,
		roll: 0,
		dices: null,
	}
}

module.exports.record = (state, { dices, category }) => {
	const scorecard = state.scorecards[state.onTurn]
	if (state.dices === null) {
		throw "NO_DICES_ROLLED"
	}
	if (scorecard[category] !== null) {
		throw "CATEGORY_ALREADY_RECORDED"
	}
	const potentialScores = count(state.dices)
	const newState = deepClone(state)
	newState.scorecards[newState.onTurn][category] = potentialScores[category]
	return advanceTurn(newState)
}
