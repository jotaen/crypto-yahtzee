const safeStringify = require("json-stable-stringify")
const sha256 = require("crypto-js/sha256")

const hash = data => {
	const isComplex = (typeof data === "object" || typeof data === "array")
	const message = isComplex ? safeStringify(data) : data
	return sha256(message).toString()
}

const isHexString = length =>
	x => typeof x === "string" && x.length === length && /^[a-f0-9]*$/.test(x)

const isHash = isHexString(64)

const dice = int => Math.abs(int % 6) + 1

module.exports = {
	hash, isHexString, isHash, dice
}
