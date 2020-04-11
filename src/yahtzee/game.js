const { createScorecard, count, isFilledUp } = require("./scorecard")

const deepClone = obj => JSON.parse(JSON.stringify(obj))

const isValidDice = d => [1, 2, 3, 4, 5, 6].includes(d)

const isValidSelection = s => [1, 2, 3, 4, 5, 6, null].includes(s)

const isSelectionCompatible = (ds, ss) => {
	const xs = [null, null, null, null, null].concat(ds)
	return ss.reduce((a, c) => {
		const i = xs.indexOf(c)
		if (i === -1) { a.push(c) }
		else { xs[i] = undefined }
		return a
	}, []).length === 0
}

module.exports.createGame = (players) => ({
	players: players,
	onTurn: 0,
	attempt: 0,
	dices: [null, null, null, null, null],
	scorecards: players.map(() => createScorecard()),
})

module.exports.roll = (state, { player, dices }) => {
	if (state.players[state.onTurn] !== player) {
		throw "NOT_ON_TURN"
	}
	const rollers = state.dices.filter(d => d === null)
	const remainers = state.dices.filter(d => d !== null)
	if (rollers.length === 0) {
		throw "NO_DICES_SELECTED"
	}
	if (dices.length !== rollers.length || !dices.every(isValidDice)) {
		throw "INVALID_ROLL"
	}
	const newDices = remainers.concat(dices).sort((a,b) => a-b)
	return { ...state, attempt: state.attempt+1, dices: newDices }
}

module.exports.select = (state, { player, dices }) => {
	if (state.players[state.onTurn] !== player) {
		throw "NOT_ON_TURN"
	}
	if (state.attempt >= 3) {
		throw "ROLLS_EXCEEDED"
	}
	if (state.dices.some(d => d === null)) {
		throw "ALREADY_SELECTED"
	}
	if (!Array.isArray(dices) || dices.length !== 5 ||
		!dices.every(isValidSelection) || !dices.some(d => d === null)) {
		throw "INVALID_SELECTION"
	}
	if (!isSelectionCompatible(state.dices, dices)) {
		throw "INCOMPATIBLE_SELECTION"
	}
	return { ...state, dices: dices.slice() }
}

const advanceTurn = (state) => {
	const nextOnTurn = state.players.length-1 === state.onTurn ? 0 : state.onTurn + 1
	return {
		...state,
		onTurn: isFilledUp(state.scorecards[nextOnTurn]) ? null : nextOnTurn,
		attempt: 0,
		dices: [null, null, null, null, null],
	}
}

module.exports.record = (state, { player, dices, category }) => {
	if (state.players[state.onTurn] !== player) {
		throw "NOT_ON_TURN"
	}
	const scorecard = state.scorecards[state.onTurn]
	if (state.dices.some(d => d === null)) {
		throw "NO_DICES_ROLLED"
	}
	if (! (category in scorecard)) {
		throw "INVALID_CATEGORY"
	}
	if (scorecard[category] !== null) {
		throw "CATEGORY_ALREADY_RECORDED"
	}
	const potentialScores = count(state.dices)
	const newState = deepClone(state)
	newState.scorecards[newState.onTurn][category] = potentialScores[category]
	return advanceTurn(newState)
}
