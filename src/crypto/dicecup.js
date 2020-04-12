const { hash, isHexString, isHash } = require("./hash")
const { Store } = require("../lib/store")
const { isString, assert, deepClone } = require("../lib/util")

const VALUE_STRING_LENGTH = 8 // 32 bit hex value

const submitHashes = (state, { player, hashes }) => {
	const pid = state.players.indexOf(player)
	;[
		["NOT_PARTICIPANT", () => pid === -1],
		["WRONG_ARITY", () => hashes.length !== state.arity],
		["ALREADY_SUBMITTED", () => state.hashes[pid] !== null],
	].forEach(assert)
	const newState = deepClone(state)
	newState.hashes[pid] = hashes
	return newState
}

const submitValues = (state, { player, values }) => {
	const pid = state.players.indexOf(player)
	;[
		["NOT_PARTICIPANT", () => pid === -1],
		["WRONG_ARITY", () => values.length !== state.arity],
		["HASHES_NOT_COMPLETE_YET", () => state.hashes.some(hs => hs === null)],
		["ALREADY_SUBMITTED", () => state.values[pid] !== null],
		["HASH_VALUE_MISMATCH", () => values.every((v, i) => state.hashes[pid][i] !== hash(v))],
	].forEach(assert)
	const newState = deepClone(state)
	newState.values[pid] = values
	return newState
}

const routes = {
	"SEED_HASHES": {
		fn: submitHashes,
		shape: {
			player: [isString],
			hashes: [
				hs => Array.isArray(hs),
				hs => hs.every(isHash),
			],
		},
	},
	"SEED_VALUES": {
		fn: submitValues,
		shape: {
			player: [isString],
			values: [
				hs => Array.isArray(hs),
				hs => hs.every(isHexString(VALUE_STRING_LENGTH)),
			],
		},
	},
}

class DiceCup extends Store {
	constructor(arity, players) {
		super(routes, {
			players: players,
			arity: arity,
			hashes: players.map(() => null),
			values: players.map(() => null),
		})
	}

	isRolled() {
		return this.getState().hashes.every(h => h !== null) &&
			this.getState().values.every(h => h !== null)
	}

	retrieveNumbers() {
		if (!this.isRolled()) {
			throw "INPUT_NOT_COMPLETE_YET"
		}

		return Array.from(Array(this.getState().arity))
			.map((_, i) => this.getState().values
					.map(vs => vs[i])
					.map(v => parseInt(v, 16))
					.reduce((a, c) => a ^ c, 0)
			)
	}
}

// Generates 32-bit random numbers with corresponding hash
const random = () => {
	const value = Math.random()
		.toString(16)
		.substr("0.".length) // float prefix
		.padEnd(VALUE_STRING_LENGTH, "0")
		.substr(0, VALUE_STRING_LENGTH)
	return {
		hash: hash(value),
		value: value,
	}
}

const toDices = integers => integers.map(i => Math.abs(i % 6) + 1)

module.exports = {
	DiceCup, toDices, random
}
