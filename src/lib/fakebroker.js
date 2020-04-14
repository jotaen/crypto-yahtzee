class Broker {
	constructor() {
		this._buffer = []
		this._games = []
	}

	connect(games) {
		this._games = games
	}

	enqueue(block) {
		this._buffer.push(block)
	}

	count() {
		return this._buffer.length
	}

	fanout() {
		if (this._buffer.length === 0) { throw new Error("Buffer empty") }
		const block = this._buffer.shift()
		this._games
			// don’t send blocks back to the issuers themselves:
			.filter(g => g._blockchain.owner().finger !== block.author)
			.forEach(g => g.receiveBlock(block))
	}
}

module.exports = { Broker }
