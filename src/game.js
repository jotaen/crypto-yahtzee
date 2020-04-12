const { createStore } = require("redux")
const { DiceCup } = require("./crypto/dicecup")
const { Yahtzee } = require("./yahtzee/yahtzee")

class Game {
	constructor(players, onRequest) {
		this._storeMachine = StoreMachine(players)
	}

	dispatch(action) {
		const store = this._storeMachine.next().value
		store.dispatch(action)
		// TODO request user action via `onRequest`
	}
}

function* StoreMachine(players) {
	const opening = new DiceCup(1, players)
	while(!opening.isRolled()) {
		yield opening
	}

	const yahtzee = new Yahtzee(players)
	while(yahtzee.isOngoing()) {
		if (yahtzee.rollingDices() > 0) {
			const diceCup = new DiceCup(yahtzee.rollingDices(), players)
			while(!diceCup.isRolled()) {
				yield diceCup
			}
		}
		yield yahtzee
	}

	return null
}

module.exports = { Game }
