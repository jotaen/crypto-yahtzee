const crypto = require("crypto")
const safeStringify = require("json-stable-stringify")
const util = require("util")

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

module.exports.generateKeyPair = () => {
	return util.promisify(crypto.generateKeyPair)('rsa', {
		modulusLength: 4096,
		publicKeyEncoding: { type: "pkcs1", format: "pem" },
		privateKeyEncoding: { type: "pkcs1", format: "pem" },
	})
}

module.exports.randomBytes = (outputFormat, length = 1) => {
	const a = new Uint8Array(length)
	return Buffer.from(crypto.randomFillSync(a).buffer, a.byteOffset, a.byteLength).toString(outputFormat)
}
