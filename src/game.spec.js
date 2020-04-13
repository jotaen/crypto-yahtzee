const { Game } = require("./game")

const randomTestData = require("./crypto/random-testdata.json")
function* Random() {
	let i = -1
	while(true) {
		i++
		yield randomTestData[i]
	}
}

const hashes = rs => rs.map(r => r.value.hash)
const values = rs => rs.map(r => r.value.value)

describe("[Game] Entire game flow", () => {
	const r = Random()
	const g = new Game(["ALICE", "BOB", "CHRIS"])

	const roll = (numberOfDices) => {
		const alice = Array.from(Array(numberOfDices)).map(() => r.next())
		const bob = Array.from(Array(numberOfDices)).map(() => r.next())
		const chris = Array.from(Array(numberOfDices)).map(() => r.next())
		g.dispatch({ type: "SEED_HASHES", player: "ALICE", hashes: hashes(alice) })
		g.dispatch({ type: "SEED_HASHES", player: "BOB", hashes: hashes(bob) })
		g.dispatch({ type: "SEED_HASHES", player: "CHRIS", hashes: hashes(chris) })
		g.dispatch({ type: "SEED_VALUES", player: "ALICE", values: values(alice) })
		g.dispatch({ type: "SEED_VALUES", player: "BOB", values: values(bob) })
		g.dispatch({ type: "SEED_VALUES", player: "CHRIS", values: values(chris) })
	}

	it("initialises the game to determine the turn order", () => {
		roll(3)
	})

	it("takes turns one after the other", () => {
		roll(5)
		g.dispatch({ type: "RECORD", player: "BOB", category: "largeStraight" })

		roll(5)
		g.dispatch({ type: "SELECT", player: "CHRIS", dices: [1, 1, 1, null, null]})
		roll(2)
		g.dispatch({ type: "SELECT", player: "CHRIS", dices: [1, 1, 1, null, null]})
		roll(2)
		g.dispatch({ type: "RECORD", player: "CHRIS", category: "aces" })

		roll(5)
		g.dispatch({ type: "SELECT", player: "ALICE", dices: [5, 5, null, null, null]})
		roll(3)
		g.dispatch({ type: "SELECT", player: "ALICE", dices: [5, 5, null, null, null]})
		roll(3)
		g.dispatch({ type: "RECORD", player: "ALICE", category: "fives" })

		roll(5)
		g.dispatch({ type: "SELECT", player: "BOB", dices: [3, 3, null, null, null]})
		roll(3)
		g.dispatch({ type: "SELECT", player: "BOB", dices: [3, 3, null, null, null]})
		roll(3)
		g.dispatch({ type: "RECORD", player: "BOB", category: "smallStraight" })
	})
})
