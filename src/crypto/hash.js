const safeStringify = require("json-stable-stringify")
const { createHash } = require("crypto")

const hash = data => {
	const isComplex = (typeof data === "object" || typeof data === "array")
	const message = isComplex ? safeStringify(data) : data
	return createHash("sha256").update(message).digest("hex")
}

const isHexString = length =>
	x => typeof x === "string" && x.length === length && /^[a-f0-9]*$/.test(x)

const isHash = isHexString(64)

const dice = int => Math.abs(int % 6) + 1

module.exports = {
	hash, isHexString, isHash, dice
}
