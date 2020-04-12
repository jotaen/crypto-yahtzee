const { createStore } = require("redux")
const randomiser = require("./crypto/randomiser")
const yahtzee = require("./yahtzee/yahtzee")

class Game {
	constructor(players, onRequest) {
		this._stateMachine = StateMachine(players)
	}

	dispatch(action) {
		const store = this._stateMachine.next().value
		store.dispatch(action)
		// TODO request user action via `onRequest`
	}
}

function* StateMachine(players) {
	const opening = createStore(randomiser.process, randomiser.init(1, players))
	while(!randomiser.isComplete(opening.getState())) {
		yield opening
	}

	const table = createStore(yahtzee.process, yahtzee.init(players))
	while(table.getState().onTurn !== null) {
		if (yahtzee.isRolling(table.getState())) {
			const shaker = createStore(
				randomiser.process,
				randomiser.init(yahtzee.countRollers(table.getState()), players)
			)
			while(!randomiser.isComplete(shaker.getState())) {
				yield shaker
			}
		}
		yield table
	}

	return null
}

module.exports = { Game }
