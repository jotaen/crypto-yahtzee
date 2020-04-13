const assert = require("assert")
const { hash, toDices, isHash, isHexString } = require("./hash")

describe("[Hash] Hash", () => {
	it("hashes primitives", () => {
		assert.strictEqual(
			hash("hello"),
			"9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043"
		)
		assert.strictEqual(
			hash(5627),
			"f0c20b9fb7e5169336b5574407ec1141759ca4d472dfe64adce6b2a13bc1540691469559681dbd86df8048c962028245d27afec46ae14ae73fa82028418388c2"
		)
	})

	it("hashes object (regardless of their property order)", () => {
		assert.strictEqual(
			hash({foo: 1, bar: 2}),
			"428e98b16d7971d55581738f7320d4cf3bc43ceef5ca7184ed0643737462378c9f21b481e44902efd08b61fddd00d11d11084b5eb5a7e26b6fe0a8366ba2c481"
		)
		assert.strictEqual(hash({foo: 1, bar: 2}), hash({bar: 2, foo: 1}))
	})

	it("doesn’t do anything for void input", () => {
		assert.strictEqual(hash(null), null)
		assert.strictEqual(hash(undefined), null)
	})
})

describe("[Hash] Validators", () => {
	it("validates hash values", () => {
		const h = hash("asdf")
		assert.strictEqual(isHash(h), true)
		assert.strictEqual(isHash(h.substr(0, 12)), false)
		assert.strictEqual(isHash(h + h), false)
		assert.strictEqual(isHash("IUASF*Y(@UP!*(*"), false)
		assert.strictEqual(isHash(123), false)
		assert.strictEqual(isHash(0x718), false)
	})

	it("validates hex strings", () => {
		assert.strictEqual(isHexString(1)("a"), true)
		assert.strictEqual(isHexString(8)("6eb8019c"), true)
		assert.strictEqual(isHexString(8)("6eb801"), false)
		assert.strictEqual(isHexString(3)(0xeab), false)
		assert.strictEqual(isHexString(4)(4637), false)
	})
})
