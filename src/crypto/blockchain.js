const { hash, isHash } = require("./hash")
const { sign, verify } = require("./rsa")
const { assert } = require("../lib/util")

const freeze = block => Object.freeze({
	...block,
	payload: Object.freeze(block.payload)
})

const BLOCK_PROPERTIES = ["precedingBlock", "author", "state", "signature", "payload"]
const isValidFormat = block =>
	Object.keys(block).every(v => BLOCK_PROPERTIES.includes(v))
	&& Object.keys(block).length === BLOCK_PROPERTIES.length
	&& isHash(block.precedingBlock)
	&& isHash(block.author)

class Blockchain {
	constructor(keyPair, rootBlock) {
		this._publicKey = keyPair.public
		this._privateKey = keyPair.private
		this._blockchain = [Object.freeze(rootBlock)]
		this._participants = rootBlock.participants
		this._stagedBlock = null
	}

	commit(block) {
		;[
			["NO_BLOCK_STAGED", () => this._stagedBlock === null],
		].forEach(assert)

		this._blockchain.push(this._stagedBlock)
		this._stagedBlock = null
	}

	stageForeignBlock(state, block) {
		;[
			["INCOMPATIBLE_BLOCK", () => block.precedingBlock !== this.latestHash()],
			["MALFORMED_BLOCK", () => ! isValidFormat(block)],
			["INVALID_SIGNATURE", () => ! verify(block, this._participants[block.author])],
			["INCOMPATIBLE_STATE", () => hash(state) !== block.state],
		].forEach(assert)

		this._stagedBlock = block
	}

	stageOwnBlock(state, payload) {
		const block = {
			precedingBlock: this.latestHash(),
			state: hash(state),
			author: hash(this._publicKey),
			payload: payload,
			signature: null,
		}
		block.signature = sign(block, this._privateKey)
		this._stagedBlock = freeze(block)
	}

	latestHash() {
		return hash(this.latestBlock())
	}

	latestBlock() {
		return this._blockchain[this._blockchain.length-1]
	}

	stagedBlock() {
		return this._stagedBlock
	}
}

const createNew = (guid, keyPair, otherPublicKeys) => {
	const participants = [keyPair.public, ...otherPublicKeys].reduce((a, c) => {
		a[hash(c)] = c
		return a
	}, {})
	return new Blockchain(keyPair, {
		precedingBlock: null,
		guid: hash(guid),
		protocolVersion: 0,
		participants: participants,
	})
}

const createWithRoot = (keyPair, rootBlock) => {
	return new Blockchain(keyPair, rootBlock)
}

module.exports = {
	createNew, createWithRoot
}
