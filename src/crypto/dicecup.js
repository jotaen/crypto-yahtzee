const { hash, isHexString, isHash } = require("./hash")
const { randomBytes } = require("./rsa")
const { Store } = require("../lib/store")
const { isString, assert, deepClone } = require("../lib/util")

const VALUE_STRING_LENGTH = 8 // 32 bit hex value

const check = (value, seed, hashStr) => {
	return hash(seed + value) === hashStr
}

const submitHashes = (state, { player, seeds, hashes }) => {
	const pid = state.players.indexOf(player)
	;[
		["NOT_PARTICIPANT", () => pid !== -1],
		["WRONG_ARITY", () => hashes.length === state.arity && seeds.length === state.arity],
		["ALREADY_SUBMITTED", () => state.hashes[pid] === null],
	].forEach(assert)
	const newState = deepClone(state)
	newState.hashes[pid] = hashes
	newState.seeds[pid] = seeds
	return newState
}

const submitValues = (state, { player, values }) => {
	const pid = state.players.indexOf(player)
	;[
		["NOT_PARTICIPANT", () => pid !== -1],
		["WRONG_ARITY", () => values.length === state.arity],
		["HASHES_NOT_COMPLETE_YET", () => state.hashes.every(hs => hs !== null)],
		["ALREADY_SUBMITTED", () => state.values[pid] === null],
		["HASH_VALUE_MISMATCH", () => values.every((v, i) => {
			return check(v, state.seeds[pid][i], state.hashes[pid][i])
		})],
	].forEach(assert)
	const newState = deepClone(state)
	newState.values[pid] = values
	return newState
}

const routes = {
	"DICECUP_HASHES": {
		fn: submitHashes,
		shape: {
			player: [isString],
			seeds: [
				ss => Array.isArray(ss),
				ss => ss.every(isHash),
			],
			hashes: [
				hs => Array.isArray(hs),
				hs => hs.every(isHash),
			],
		},
	},
	"DICECUP_VALUES": {
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
			seeds: players.map(() => null),
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

	canSubmitHashes(player) {
		const pid = this.getState().players.indexOf(player)
		return this.getState().hashes[pid] === null
	}

	canSubmitValues(player) {
		const pid = this.getState().players.indexOf(player)
		return this.getState().values[pid] === null && this.getState().hashes.every(h => h !== null)
	}
}

const random = () => {
	const value = randomBytes("hex", 4)
	const seed = Array.from(Array(hash("").length/VALUE_STRING_LENGTH))
		.map(() => randomBytes("hex", 4))
		.join("")
	return {
		hash: hash(seed + value),
		seed: seed,
		value: value,
	}
}

const toDices = integers => integers.map(i => Math.abs(i % 6) + 1)

module.exports = {
	DiceCup, toDices, random
}
