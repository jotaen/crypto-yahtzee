const { hash, isHexString, isHash } = require("./hash")
const { route } = require("../lib/redux")
const { isString, assert, deepClone } = require("../lib/util")

const VALUE_STRING_LENGTH = 8 // 32 bit hex value

const init = (arity, players) => ({
	players: players,
	arity: arity,
	hashes: players.map(() => null),
	values: players.map(() => null),
})

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

const process = route({
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
})

const isComplete = state => {
	return state.hashes.every(h => h !== null) && state.values.every(h => h !== null)
}

const retrieveNumbers = state => {
	if (!isComplete(state)) {
		throw "INPUT_NOT_COMPLETE_YET"
	}

	return Array.from(Array(state.arity))
		.map((_, i) => state.values
				.map(vs => vs[i])
				.map(v => parseInt(v, 16))
				.reduce((a, c) => a ^ c, 0)
		)
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

module.exports = {
	isComplete, retrieveNumbers, process, random, init
}
