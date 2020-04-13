const deepClone = obj => JSON.parse(JSON.stringify(obj))

const deepFreeze = obj => Object.freeze(Object.entries(obj)
	.reduce((a, [key, val]) => {
		a[key] = (val !== null && typeof val === "object") ? deepFreeze(val) : val
		return a
	}, {}))

const isString = x => typeof x === "string"

const isSubset = (ds, ss) => {
	const xs = ds.slice()
	return ss.reduce((a, c) => {
		const i = xs.indexOf(c)
		if (i === -1) { a.push(c) }
		else { xs[i] = undefined }
		return a
	}, []).length === 0
}

const assert = ([msg, assertation]) => { if (assertation()) throw msg; }

const sortBy = (things, numbers) => things
	.map((t, i) => ({ t: t, x: numbers[i] }))
	.sort((a, b) => a.x-b.x)
	.map(o => o.t)

const noop = () => {}

module.exports = {
	isString, deepClone, deepFreeze, isSubset, assert, sortBy, noop
}
