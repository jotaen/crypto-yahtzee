const { hash, isHexString, isHash } = require("./hash")

const isOkay = entry => {
	if (!entry.hashes || !entry.values) {
		return true
	}
	if (entry.values.every((v, i) => entry.hashes[i] === hash(v))) {
		return true
	}
	return false
}

const VALUE_STRING_LENGTH = 8 // 32 bit hex value

class ConcertedRandomiser {
	constructor(arity, participants) {
		this._arity = arity
		this._entries = participants.reduce((a, c) => {
			a[c] = { hashes: null, values: null }
			return a
		}, {})
	}

	_submit(kind, validate, participant, ds) {
		if (!Array.isArray(ds) || ds.length !== this._arity) {
			throw "WRONG_ARITY"
		}
		if (!ds.every(validate)) {
			throw "MALFORMED_VALUE"
		}
		if (! (participant in this._entries)) {
			throw "NOT_PARTICIPANT"
		}
		if (this._entries[participant][kind] !== null) {
			throw "ALREADY_SUBMITTED"
		}
		const candidate = { ...this._entries[participant], [kind]: ds }
		if (!isOkay(candidate)) {
			throw "HASH_VALUE_MISMATCH"
		}
		this._entries[participant] = candidate
	}

	submitHashes(participant, hashes) {
		this._submit("hashes", isHash, participant, hashes)
	}

	submitValues(participant, values) {
		if (Object.values(this._entries).some(e => e.hashes === null)) {
			throw "NO_HASH_SUBMITTED_YET"
		}
		this._submit("values", isHexString(VALUE_STRING_LENGTH), participant, values)
	}

	isComplete() {
		return Object.values(this._entries).every(e => e.hashes !== null && e.values !== null)
	}

	retrieveNumbers() {
		if (!this.isComplete()) {
			throw "INPUT_NOT_COMPLETE_YET"
		}
		const allValues = Object.values(this._entries)
			.map(e => e.values)

		return Array.from(Array(this._arity))
			.map((_, i) => allValues
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

module.exports = {
	ConcertedRandomiser, random, VALUE_STRING_LENGTH
}
