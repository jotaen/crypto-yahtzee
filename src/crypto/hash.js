const safeStringify = require("json-stable-stringify")
const { createHash } = require("crypto")

const HASHABLE_PREDICATES = [
	x => typeof x === "object" && x !== null,
	x => typeof x === "array",
	x => typeof x === "string",
	x => typeof x === "number" && !Number.isNaN(x),
]

const hash = data => {
	if (!HASHABLE_PREDICATES.some(p => p(data))) {
		return null
	}
	const isComplex = ["object", "array"].includes(typeof data)
	const message = isComplex ? safeStringify(data) : String(data)
	return createHash("sha512").update(message).digest("hex")
}

const isHexString = length =>
	x => typeof x === "string" && x.length === length && /^[a-f0-9]*$/.test(x)

const isHash = isHexString(128)

module.exports = {
	hash, isHexString, isHash
}
