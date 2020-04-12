const { createScorecard, count, isFilledUp } = require("./scorecard")
const { isOfShape } = require("../lib/redux")
const { isString, deepClone } = require("../lib/util")

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

const init = (players) => ({
	players: players,
	onTurn: 0,
	attempt: 0,
	dices: [null, null, null, null, null],
	scorecards: players.map(() => createScorecard()),
})

const roll = (state, { player, dices }) => {
	if (state.players[state.onTurn] !== player) {
		throw "NOT_ON_TURN"
	}
	const rollers = state.dices.filter(d => d === null)
	const remainers = state.dices.filter(d => d !== null)
	if (rollers.length === 0) {
		throw "NO_DICES_SELECTED"
	}
	if (dices.length !== rollers.length) {
		throw "INVALID_ROLL"
	}
	const newDices = remainers.concat(dices).sort((a,b) => a-b)
	return { ...state, attempt: state.attempt+1, dices: newDices }
}

const select = (state, { player, dices }) => {
	if (state.players[state.onTurn] !== player) {
		throw "NOT_ON_TURN"
	}
	if (state.attempt >= 3) {
		throw "ROLLS_EXCEEDED"
	}
	if (state.dices.some(d => d === null)) {
		throw "ALREADY_SELECTED"
	}
	if (!isSelectionCompatible(state.dices, dices)) {
		throw "INCOMPATIBLE_SELECTION"
	}
	return { ...state, dices: dices.slice() }
}

const record = (state, { player, category }) => {
	if (state.players[state.onTurn] !== player) {
		throw "NOT_ON_TURN"
	}
	const scorecard = state.scorecards[state.onTurn]
	if (state.dices.some(d => d === null)) {
		throw "NO_DICES_ROLLED"
	}
	if (scorecard[category] !== null) {
		throw "CATEGORY_ALREADY_RECORDED"
	}
	const newState = deepClone(state)
	const nextOnTurn = state.players.length-1 === state.onTurn ? 0 : state.onTurn + 1
	newState.scorecards[newState.onTurn][category] = count(state.dices)[category]
	newState.onTurn = isFilledUp(newState.scorecards[nextOnTurn]) ? null : nextOnTurn
	newState.attempt = 0
	newState.dices = [null, null, null, null, null]
	return newState
}

const registry = {
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
}

const reduce = (state, action) => {
	const r = registry[action.type]
	if (!r || !isOfShape(r.shape, action)) {
		throw "BAD_ACTION"
	}
	return r.fn(state, action)
}

module.exports = {
	reduce, init
}
