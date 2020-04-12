const { createScorecard, count, isFilledUp } = require("./scorecard")
const { route } = require("../lib/redux")
const { isString, deepClone, isSubset, assert } = require("../lib/util")

const init = (players) => ({
	players: players,
	onTurn: 0,
	attempt: 0,
	dices: [null, null, null, null, null],
	scorecards: players.map(() => createScorecard()),
})

const roll = (state, { player, dices }) => {
	const rollers = state.dices.filter(d => d === null)
	const remainers = state.dices.filter(d => d !== null)
	;[
		["NOT_ON_TURN", () => state.players[state.onTurn] !== player],
		["NO_DICES_SELECTED", () => rollers.length === 0],
		["INVALID_ROLL", () => dices.length !== rollers.length],
	].forEach(assert)
	const newDices = remainers.concat(dices).sort((a,b) => a-b)
	return { ...state, attempt: state.attempt+1, dices: newDices }
}

const select = (state, { player, dices }) => {
	const remainers = dices.filter(d => d !== null)
	;[
		["NOT_ON_TURN", () => state.players[state.onTurn] !== player],
		["ROLLS_EXCEEDED", () => state.attempt >= 3],
		["ALREADY_SELECTED", () => state.dices.some(d => d === null)],
		["INCOMPATIBLE_SELECTION", () => !isSubset(state.dices, remainers)],
	].forEach(assert)
	return { ...state, dices: dices.slice() }
}

const record = (state, { player, category }) => {
	const scorecard = state.scorecards[state.onTurn]
	;[
		["NOT_ON_TURN", () => state.players[state.onTurn] !== player],
		["NO_DICES_ROLLED", () => state.dices.some(d => d === null)],
		["CATEGORY_ALREADY_RECORDED", () => scorecard[category] !== null],
	].forEach(assert)
	const newState = deepClone(state)
	const nextOnTurn = state.players.length-1 === state.onTurn ? 0 : state.onTurn + 1
	newState.scorecards[newState.onTurn][category] = count(state.dices)[category]
	newState.onTurn = isFilledUp(newState.scorecards[nextOnTurn]) ? null : nextOnTurn
	newState.attempt = 0
	newState.dices = [null, null, null, null, null]
	return newState
}

const isValidDice = d => [1, 2, 3, 4, 5, 6].includes(d)

const isValidSelection = s => [1, 2, 3, 4, 5, 6, null].includes(s)

const process = route({
	"ROLL": {
		fn: roll,
		shape: {
			player: [isString],
			dices: [
				ds => Array.isArray(ds),
				ds => ds.every(isValidDice),
				ds => ds.length >= 1 && ds.length <= 5,
			],
		},
	},
	"SELECT": {
		fn: select,
		shape: {
			player: [isString],
			dices: [
				ds => Array.isArray(ds),
				ds => ds.length === 5,
				ds => ds.every(isValidSelection),
				ds => ds.some(d => d === null)
			],
		},
	},
	"RECORD": {
		fn: record,
		shape: {
			player: [isString],
			category: [c => Object.keys(createScorecard()).includes(c)],
		},
	},
})

module.exports = {
	process, init
}
