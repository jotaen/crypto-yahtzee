const { DiceCup, toDices, random } = require("./crypto/dicecup")
const { Blockchain } = require("./crypto/blockchain")
const { Yahtzee } = require("./yahtzee/yahtzee")
const { sortBy, noop } = require("./lib/util")

class Game {
	constructor(privateKey, otherPlayersPublicKeys, callbacks) {
		this._blockchain = new Blockchain(privateKey, otherPlayersPublicKeys)
		this._storePointer = StoreMachine(this._blockchain.participants())
		this._yahtzee = null
		this._diceCup = null
		this._dices = null
		this._blockBuffer = {}
		this._callbacks = {
			onTurn: noop,
			onPopulateBlock: noop,
			...callbacks,
		}
		this._update()
	}

	receiveBlock(block) {
		if (!this._blockchain.isCompatible(block)) {
			this._blockBuffer[block.precedingBlock] = block
			return
		}
		this._blockchain.commitForeignBlock(this._yahtzee, block, (payload, author) => {
			if (author !== payload.player) {
				throw "AUTHORISATION_FAILURE"
			}
			this._storePointer.next().value.dispatch(block.payload)
		})
		this._update()
		delete this._blockBuffer[block.precedingBlock]
		for (let hash in this._blockBuffer) {
			this.receiveBlock(this._blockBuffer[hash])
		}
		return
	}

	_update() {
		const currentStore = this._storePointer.next().value
		const handler = [
			[DiceCup, "_handleDicing"],
			[Yahtzee, "_handleTurn"],
		].find(([T]) => currentStore instanceof T)[1]
		this[handler]((currentStore))
	}

	_handleTurn(yahtzee) {
		if (yahtzee.onTurn(this._blockchain.owner().public)) {
			this._callbacks.onTurn(yahtzee.getState())
		}
	}

	_handleDicing(diceCup) {
		if (this._diceCup !== diceCup) {
			this._diceCup = diceCup
			this._dices = Array.from(Array(diceCup.getState().arity)).map(() => random())
		}
		if (diceCup.canSubmitHashes(this._blockchain.owner().public)) {
			this._dispatchOwnAction({
				type: "DICECUP_HASHES",
				player: this._blockchain.owner().public,
				seeds: this._dices.map(d => d.seed),
				hashes: this._dices.map(d => d.hash),
			})
		}
		if (diceCup.canSubmitValues(this._blockchain.owner().public)) {
			this._dispatchOwnAction({
				type: "DICECUP_VALUES",
				player: this._blockchain.owner().public,
				values: this._dices.map(d => d.value),
			})
		}
	}

	_dispatchOwnAction(action) {
		this._storePointer.next().value.dispatch(action)
		this._blockchain.commitOwnBlock(this._yahtzee, action)
		this._callbacks.onPopulateBlock(this._blockchain.head()[0])
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
		if (!yahtzee.isRolling()) {
			yield yahtzee
		}
		const diceCup = new DiceCup(yahtzee.rollingDices(), orderedPlayers)
		while(!diceCup.isRolled()) {
			yield diceCup
		}
		const dices = toDices(diceCup.retrieveNumbers())
		yahtzee.dispatch({ type: "ROLL", player: yahtzee.onTurn(), dices })
	}

	return null
}

module.exports = { Game }
