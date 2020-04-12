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
const route = registry => (state, action) => {
	const r = registry[action.type] || defaultRoute
	if (!isOfShape(r.shape, action)) {
		throw "BAD_ACTION"
	}
	return r.fn(state, action)
}

const flow = state => ({
	then: fn => flow(fn(state)),
	peak: fn => { fn(state); return flow(state); },
})

module.exports = {
	route, flow
}
