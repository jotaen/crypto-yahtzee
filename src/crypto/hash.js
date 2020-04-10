const safeStringify = require("json-stable-stringify")
const sha256 = require("crypto-js/sha256")

module.exports.hash = data => {
	const isComplex = (typeof data === "object" || typeof data === "array")
	const message = isComplex ? safeStringify(data) : data
	return sha256(message).toString()
}

module.exports.dice = int => Math.abs(int) % 6 + 1
