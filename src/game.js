const { DiceCup, toDices, random } = require("./crypto/dicecup")
const { Blockchain } = require("./crypto/blockchain")
const { Yahtzee } = require("./yahtzee/yahtzee")
const { sortBy, noop } = require("./lib/util")

class Game {
	constructor(ownerKeyO, otherPlayersKeyO, callbacks) {
		this._blockchain = new Blockchain(ownerKeyO, otherPlayersKeyO)
		this._callbacks = {
			onUpdate: noop,
			onTurn: noop,
			onViewOthers: noop,
			onPopulateBlock: noop,
			onGameEnd: noop,
			...callbacks,
		}
		this._storePointer = StoreMachine(this._blockchain.participantsFinger(), this._callbacks.onUpdate)
		this._yahtzee = null
		this._diceCup = null
		this._dices = null
		this._update()
	}

	receiveBlock(block) {
		if (!this._blockchain.isCompatible(block)) {
			return false
		}
		this._blockchain.commitForeignBlock(this._yahtzee, block, (payload, author) => {
			if (author !== payload.player) {
				throw "AUTHORISATION_FAILURE"
			}
			this._storePointer.next().value.dispatch(block.payload)
		})
		this._update()
		return true
	}

	_update() {
		const currentStore = this._storePointer.next().value
		const handler = [
			[DiceCup, "_handleDicing"],
			[Yahtzee, "_handleTurn"],
		].find(([T]) => currentStore instanceof T)
		if (handler) {
			this[handler[1]]((currentStore))
		} else {
			this._callbacks.onGameEnd()
			process.exit(0)
		}
	}

	_handleTurn(yahtzee) {
		if (yahtzee.onTurn() !== this._blockchain.ownerFinger()) {
			this._callbacks.onViewOthers(yahtzee.getState())
			return
		}
		const record = category => {
			this._dispatchOwnAction({
				type: "RECORD",
				player: this._blockchain.ownerFinger(),
				category: category,
			})
			this._update()
		}
		const select = !yahtzee.areAttemptsLeft() ? null : dices => {
			this._dispatchOwnAction({
				type: "SELECT",
				player: this._blockchain.ownerFinger(),
				dices: dices,
			})
			this._update()
		}
		this._callbacks.onTurn(yahtzee.getState(), record, select)
	}

	_handleDicing(diceCup) {
		if (this._diceCup !== diceCup) {
			this._diceCup = diceCup
			this._dices = Array.from(Array(diceCup.getState().arity)).map(() => random())
		}
		if (diceCup.canSubmitHashes(this._blockchain.ownerFinger())) {
			this._dispatchOwnAction({
				type: "DICECUP_HASHES",
				player: this._blockchain.ownerFinger(),
				seeds: this._dices.map(d => d.seed),
				hashes: this._dices.map(d => d.hash),
			})
		}
		if (diceCup.canSubmitValues(this._blockchain.ownerFinger())) {
			this._dispatchOwnAction({
				type: "DICECUP_VALUES",
				player: this._blockchain.ownerFinger(),
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

function* StoreMachine(players, onUpdate) {
	const opening = new DiceCup(players.length, players)
	while(!opening.isRolled()) {
		yield opening
	}

	const orderedPlayers = sortBy(players, opening.retrieveNumbers())
	const yahtzee = new Yahtzee(orderedPlayers)
	onUpdate(yahtzee.getState())
	while(!yahtzee.isFinished()) {
		if (yahtzee.canRoll()) {
			const diceCup = new DiceCup(yahtzee.rollingDices(), orderedPlayers)
			while(!diceCup.isRolled()) {
				yield diceCup
			}
			const dices = toDices(diceCup.retrieveNumbers())
			yahtzee.dispatch({ type: "ROLL", player: yahtzee.onTurn(), dices })
		} else {
			yield yahtzee
			onUpdate(yahtzee.getState())
		}
	}

	return null
}

module.exports = { Game }
