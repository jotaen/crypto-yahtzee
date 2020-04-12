const { createStore } = require("redux")
const { isString } = require("./util")

const isOfShape = (shape, action) => {
	const ps = Object.entries(shape)
	ps.push(["type", [isString]])
	const isValid = ps.every(
		([propName, predicates]) => predicates.every(p => p(action[propName]))
	)
	const hasSameLength = ps.length === Object.values(action).length
	return isValid && hasSameLength
}

const defaultRoute = {
	fn: state => state,
	shape: {},
}

const route = routes => (state, action) => {
	const r = routes[action.type] || defaultRoute
	if (!isOfShape(r.shape, action)) {
		throw "BAD_ACTION"
	}
	return r.fn(state, action)
}

class Store {
	constructor(routes, initialState) {
		this._store = createStore(route(routes), initialState)
	}

	dispatch(action) {
		return this._store.dispatch(action)
	}
}

module.exports = {
	Store
}
