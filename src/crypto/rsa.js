const crypto = require("crypto")
const safeStringify = require("json-stable-stringify")

const ALGORITHM = "sha256"
const SERIALISATION_BASE = "hex"

module.exports.sign = (block, privateKey) => {
	const json = safeStringify({ ...block, signature: null })
	return crypto.sign(ALGORITHM, Buffer.from(json), privateKey).toString(SERIALISATION_BASE)
}

module.exports.verify = (block, publicKey) => {
	const signature = block.signature
	const json = safeStringify({ ...block, signature: null })
	return crypto.verify(ALGORITHM, Buffer.from(json), publicKey, Buffer.from(signature, SERIALISATION_BASE))
}
