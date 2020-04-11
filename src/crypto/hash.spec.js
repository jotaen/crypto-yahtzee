const assert = require("assert")
const { hash, dice, isHash, isHexString } = require("./hash")

describe("[Hash] Hash", () => {
	it("hashes primitives", () => {
		assert.strictEqual(
			hash("hello"),
			"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
		)
	})

	it("hashes object regardless of their property order", () => {
		assert.strictEqual(hash({foo: 1, bar: 2}), hash({bar: 2, foo: 1}))
	})
})

describe("[Hash] Dice", () => {
	it("yields values between [1-6]", () => {
		assert.strictEqual(dice(0), 1)
		assert.strictEqual(dice(1), 2)
		assert.strictEqual(dice(2), 3)
		assert.strictEqual(dice(3), 4)
		assert.strictEqual(dice(4), 5)
		assert.strictEqual(dice(5), 6)
		assert.strictEqual(dice(6), 1)
		assert.strictEqual(dice(373347153), 4)
		assert.strictEqual(dice(-1099927788), 1)
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
