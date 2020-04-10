const stringify = require("json-stable-stringify")
const sha256 = require("crypto-js/sha256")
const crypto = require("crypto")

module.exports.generateKeyPair = () => {
	return null
}

module.exports.verify = (signature, publicKey, data) => {
	return null
}

module.exports.sign = (privateKey, data) => {
	return null
}

module.exports.hash = (data) => {
	const isComplex = (typeof data === "object" || typeof data === "array")
	const message = isComplex ? stringify(data) : data
	return sha256(message).toString()
}

module.exports.random = (byteSize) => {
	return crypto.randomBytes(byteSize)
}
