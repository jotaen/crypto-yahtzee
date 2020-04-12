const { Game } = require("./game")
const { random } = require("./crypto/dicecup")

const hashes = rs => rs.map(r => r.hash)
const values = rs => rs.map(r => r.value)

describe("[Game]", () => {
	it("handles the entire game flow", () => {
		const g = new Game(["ALICE", "BOB"])

		{
			const alice = [random(), random()]
			const bob = [random(), random()]
			g.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: hashes(alice) })
			g.dispatch({ type: "SEED_HASHES", player: "BOB", hashes: hashes(bob) })
			g.dispatch({ type: "SEED_VALUES", player: "ALICE", values: values(alice) })
			g.dispatch({ type: "SEED_VALUES", player: "BOB", values: values(bob) })
		}

		{
			const alice = [random(), random(), random(), random(), random()]
			const bob = [random(), random(), random(), random(), random()]
			g.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: hashes(alice) })
			g.dispatch({ type: "SEED_HASHES", player: "BOB", hashes: hashes(bob) })
			g.dispatch({ type: "SEED_VALUES", player: "ALICE", values: values(alice) })
			g.dispatch({ type: "SEED_VALUES", player: "BOB", values: values(bob) })
		}

		// g.dispatch({ type: "SELECT", player: "ALICE", dices: [1, null, null, null, null] })
	})
})
