const { createStore } = require("redux")
const { DiceCup, toDices } = require("./crypto/dicecup")
const { Yahtzee } = require("./yahtzee/yahtzee")
const { sortBy } = require("./lib/util")

class Game {
	constructor(players) {
		this._storeMachine = StoreMachine(players)
	}

	dispatch(action) {
		this._storeMachine.next().value.dispatch(action)

		// invoke generator again to advance/flush internal state
		return this._storeMachine.next()
	}
}

function* StoreMachine(players) {
	const opening = new DiceCup(players.length, players)
	while(!opening.isRolled()) {
		yield opening
	}

	const orderedPlayers = sortBy(players, opening.retrieveNumbers())
	const yahtzee = new Yahtzee(orderedPlayers)
	while(yahtzee.isOngoing()) {
		if (yahtzee.rollingDices() > 0) {
			const diceCup = new DiceCup(yahtzee.rollingDices(), orderedPlayers)
			while(!diceCup.isRolled()) {
				yield diceCup
			}
			const dices = toDices(diceCup.retrieveNumbers())
			yahtzee.dispatch({ type: "ROLL", player: yahtzee.onTurn(), dices })
		}
		yield yahtzee
	}

	return null
}

module.exports = { Game }
