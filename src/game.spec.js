const { Game } = require("./game")
const { random } = require("./crypto/dicecup")

describe("[Game]", () => {
	it("handles the entire game flow", () => {
		const g = new Game(["ALICE", "BOB"])
		const alice = random()
		const bob = random()
		g.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [alice.hash] })
		g.dispatch({ type: "SEED_HASHES", player: "BOB", hashes: [bob.hash] })
		g.dispatch({ type: "SEED_VALUES", player: "ALICE", values: [alice.value] })
		g.dispatch({ type: "SEED_VALUES", player: "BOB", values: [bob.value] })

		g.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: [alice.hash, alice.hash, alice.hash, alice.hash, alice.hash] })
	})
})
