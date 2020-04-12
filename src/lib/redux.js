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

module.exports = {
	isOfShape
}
