const { hash } = require("./hash")
const { sign, verify } = require("./rsa")

const freeze = block => Object.freeze({
	...block,
	payload: Object.freeze(block.payload)
})

class Blockchain {
	constructor(keyPair, rootBlock) {
		this._publicKey = keyPair.public
		this._privateKey = keyPair.private
		this._blockchain = [Object.freeze(rootBlock)]
		this._participants = rootBlock.participants
		this._stagedBlock = null
	}

	commit(block) {
		if (this._stagedBlock === null) {
			throw "NO_BLOCK_STAGED"
		}
		this._blockchain.push(this._stagedBlock)
		this._stagedBlock = null
	}

	stageForeignBlock(state, block) {
		if (block.precedingBlock !== hash(this.latestBlock())) {
			throw "INCOMPATIBLE_BLOCK"
		}
		if (! verify(block, this._participants[block.author])) {
			throw "INVALID_SIGNATURE"
		}
		this._stagedBlock = block
	}

	stageOwnBlock(state, payload) {
		const block = {
			precedingBlock: hash(this.latestBlock()),
			// state: hash(state), // TODO
			author: hash(this._publicKey),
			payload: payload,
			signature: null,
		}
		block.signature = sign(block, this._privateKey)
		this._stagedBlock = freeze(block)
	}

	latestBlock() {
		return this._blockchain[this._blockchain.length-1]
	}

	stagedBlock() {
		return this._stagedBlock
	}
}

module.exports.Blockchain = Blockchain

module.exports.createNew = (guid, keyPair, otherPublicKeys) => {
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

module.exports.createWithRoot = (keyPair, rootBlock) => {
	return new Blockchain(keyPair, rootBlock)
}
