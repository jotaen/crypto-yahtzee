const { hash, isHash } = require("./hash")
const { sign, verify } = require("./rsa")
const { assert, noop } = require("../lib/util")

const BLOCK_PROPERTIES = ["precedingBlock", "author", "state", "signature", "payload"]
const isValidFormat = block =>
	Object.keys(block).every(v => BLOCK_PROPERTIES.includes(v))
	&& Object.keys(block).length === BLOCK_PROPERTIES.length
	&& isHash(block.precedingBlock)
	&& isHash(block.author)

class Blockchain {
	constructor(ownerKeyPair, otherParticipantsPublicKeys) {
		this._participants = [ownerKeyPair.public, ...otherParticipantsPublicKeys]
			.reduce((a, c) => {
				a[hash(c)] = c
				return a
			}, {})
		this._publicKey = ownerKeyPair.public
		this._privateKey = ownerKeyPair.private
		this._blockchain = [[Object.freeze({
			precedingBlock: null,
			protocolVersion: 0,
			participants: this._participants,
		})]]
	}

	isCompatible(block) {
		return [hash(this.head()), hash(this._ancestor())].includes(block.precedingBlock)
	}

	commitForeignBlock(state, block, transaction = noop) {
		;[
			["INCOMPATIBLE_BLOCK", () => this.isCompatible(block)],
			["MALFORMED_BLOCK", () => isValidFormat(block)],
			["INVALID_SIGNATURE", () => verify(block, this._participants[block.author])],
			["INCOMPATIBLE_STATE", () => hash(state) === block.state],
		].forEach(assert)
		if (this.head().some(b => hash(b) === hash(block))) {
			return
		}
		// commit won’t be reached if transaction throws:
		transaction(block.payload, this._participants[block.author])
		this._commit(block)
	}

	commitOwnBlock(state, payload) {
		const block = {
			precedingBlock: hash(this.head()),
			state: hash(state),
			author: this.owner().finger,
			payload: payload,
			signature: null,
		}
		block.signature = sign(block, this._privateKey)
		this._commit(block)
	}

	head() {
		return this._blockchain[this._blockchain.length-1]
	}

	participants() {
		return Object.values(this._participants).sort()
	}

	owner() {
		return {
			public: this._publicKey,
			finger: hash(this._publicKey),
		}
	}

	_ancestor() {
		return this._blockchain[this._blockchain.length-2]
	}

	_commit(block) {
		if (block.precedingBlock === hash(this.head())) {
			this._blockchain.push([])
		}
		this.head().push(Object.freeze(block))
		this.head().sort((a,b) => a.author < b.author ? -1 : 1)
	}
}

module.exports = {
	Blockchain
}
