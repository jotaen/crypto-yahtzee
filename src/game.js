const { DiceCup, toDices } = require("./crypto/dicecup")
const { Blockchain } = require("./crypto/blockchain")
const { hash } = require("./crypto/hash")
const { Yahtzee } = require("./yahtzee/yahtzee")
const { sortBy, noop } = require("./lib/util")

class Game {
	constructor(privateKey, otherPlayersPublicKeys, callbacks) {
		this._blockchain = new Blockchain(privateKey, otherPlayersPublicKeys)
		this._storePointer = StoreMachine(this._blockchain.participants())
		this._yahtzee = null
		this._dices = null
		this._callbacks = {
			onRoll: noop,
			onSelect: noop,
			onRecord: noop,
			onPopulateBlock: noop,
			...callbacks,
		}
		this._update()
	}

	receiveBlock(block) {
		this._blockchain.commitForeignBlock(this._yahtzee, block, (payload, author) => {
			if (author !== payload.player) {
				throw "AUTHORISATION_FAILURE"
			}
			this._storePointer.next().value.dispatch(block.payload)
		})
		this._update()
	}

	select(dices) {
		this._dispatchOwnAction({
			type: "SELECT",
			player: this._blockchain.owner().public,
			dices: dices,
		})
	}

	_update() {
		const currentStore = this._storePointer.next().value
		if (currentStore instanceof DiceCup) {
			this._updateDices(currentStore)
		}
	}

	_updateDices(diceCup) {
		if (this._dices === null) {
			this._dices = this._callbacks.onRoll(diceCup.getState().arity)
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
			this._dices = null
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
