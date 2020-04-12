const deepClone = obj => JSON.parse(JSON.stringify(obj))

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

module.exports = {
	isString, deepClone, isSubset, assert
}
