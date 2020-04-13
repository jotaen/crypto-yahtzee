const { DiceCup, toDices } = require("./crypto/dicecup")
const { Blockchain } = require("./crypto/blockchain")
const { hash } = require("./crypto/hash")
const { Yahtzee } = require("./yahtzee/yahtzee")
const { sortBy, noop } = require("./lib/util")

class Game {
	constructor(privateKey, otherPlayersPublicKeys, callbacks) {
		this._blockchain = new Blockchain(privateKey, otherPlayersPublicKeys)
		this._owner = this._blockchain.owner()
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
		if (hash(block.payload.player) !== block.author) {
			return
		}
		this._blockchain.stageForeignBlock(this._yahtzee, block)
		this._storePointer.next().value.dispatch(block.payload)
		this._blockchain.commit()
	}

	select(dices) {
		this._dispatchOwnAction({
			type: "SELECT",
			player: this._owner,
			dices: dices,
		})
	}

	_update() {
		const currentStore = this._storePointer.next().value
		if (currentStore instanceof Yahtzee) {
			this._yahtzee == s
		}
		if (currentStore instanceof DiceCup) {
			this._dices = this._callbacks.onRoll(currentStore.getState().arity)
			this._dispatchOwnAction({
				type: "DICECUP_HASHES",
				player: this._owner,
				seeds: this._dices.map(d => d.seed),
				hashes: this._dices.map(d => d.hash),
			})
		}
	}

	_dispatchOwnAction(action) {
		this._storePointer.next().value.dispatch(action)
		this._blockchain.stageOwnBlock(this._yahtzee, action)
		this._blockchain.commit()
		this._callbacks.onPopulateBlock(this._blockchain.latestBlock())
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
