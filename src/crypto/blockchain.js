const { hash, isHash } = require("./hash")
const { sign, verify } = require("./rsa")
const { assert, deepFreeze, noop } = require("../lib/util")

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
		this._blockchain = [deepFreeze({
			precedingBlock: null,
			protocolVersion: 0,
			participants: this._participants,
		})]
	}

	commitForeignBlock(state, block, transaction = noop) {
		;[
			["INCOMPATIBLE_BLOCK", () => block.precedingBlock !== this.latestHash()],
			["MALFORMED_BLOCK", () => ! isValidFormat(block)],
			["INVALID_SIGNATURE", () => ! verify(block, this._participants[block.author])],
			["INCOMPATIBLE_STATE", () => hash(state) !== block.state],
		].forEach(assert)
		transaction() // commit won’t be reached if assertion throws
		this._commit(block)
	}

	commitOwnBlock(state, payload) {
		const block = {
			precedingBlock: this.latestHash(),
			state: hash(state),
			author: hash(this._publicKey),
			payload: payload,
			signature: null,
		}
		block.signature = sign(block, this._privateKey)
		this._commit(block)
	}

	latestHash() {
		return hash(this.latestBlock())
	}

	latestBlock() {
		return this._blockchain[this._blockchain.length-1]
	}

	participants() {
		return Object.values(this._participants).sort()
	}

	owner() {
		return this._publicKey
	}

	_commit(block) {
		this._blockchain.push(deepFreeze(block))
	}
}

module.exports = {
	Blockchain
}
