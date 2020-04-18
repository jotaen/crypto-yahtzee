const crypto = require("crypto")
const safeStringify = require("json-stable-stringify")
const util = require("util")
const { hash } = require("./hash")

const ALGORITHM = "sha256"
const SERIALISATION_BASE = "hex"

const sign = (block, privateKeyObject) => {
	const json = safeStringify({ ...block, signature: null })
	return crypto.sign(ALGORITHM, Buffer.from(json), privateKeyObject).toString(SERIALISATION_BASE)
}

const verify = (block, publicKeyObject) => {
	const signature = block.signature
	const json = safeStringify({ ...block, signature: null })
	return crypto.verify(ALGORITHM, Buffer.from(json), publicKeyObject, Buffer.from(signature, SERIALISATION_BASE))
}

const generateKeyPair = () => {
	return util.promisify(crypto.generateKeyPair)("rsa", {
		modulusLength: 4096,
		publicKeyEncoding: { type: "pkcs1", format: "pem" },
		privateKeyEncoding: { type: "pkcs1", format: "pem" },
	})
}

const keyObjects = (publicKeyString, privateKeyString = null) => {
	const public = crypto.createPublicKey(publicKeyString)
	const private = privateKeyString === null ? null : crypto.createPrivateKey(privateKeyString)
	return {
		public: public,
		private: private,
		finger: hash(public.export({ type: "pkcs1", format: "pem" })),
	}
}

const randomBytes = (outputFormat, length = 1) => {
	const a = new Uint8Array(length)
	return Buffer.from(crypto.randomFillSync(a).buffer, a.byteOffset, a.byteLength).toString(outputFormat)
}

module.exports = {
	sign, verify, generateKeyPair, keyObjects, randomBytes
}
