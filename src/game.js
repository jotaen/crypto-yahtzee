const { createStore } = require("redux")
const yahtzee = require("./yahtzee")

const reducer = (state, action) => {
	const reducer = yahtzee[action.type] || (() => state)
	return reducer(action)
}

class Game {
	constructor(playerKeys) {
		this.store = createStore(
			reducer,
			yahtzee.createInitialState(playerKeys.length)
		)
	}

	commit(action) {

	}

	hash() {

	}

	state() {
		return this.store.getState()
	}
}

module.exports.Game = Game
