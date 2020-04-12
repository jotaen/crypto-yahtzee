const deepClone = obj => JSON.parse(JSON.stringify(obj))

const isString = x => typeof x === "string"

module.exports = {
	isString, deepClone
}
