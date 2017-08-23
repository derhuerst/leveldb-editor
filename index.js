'use strict'

const esc = require('ansi-escapes')
const wrap = require('prompt-skeleton')

const UI = {
	moveCursor: function (n) {
		this.cursor = n
		this.value = this.values[n].value
		this.emit()
	},

	reset: function () {
		this.moveCursor(0)
		this.render()
	},
	abort: function () {
		this.done = this.aborted = true
		this.render()
		this.out.write('\n')
		this.close()
	},
	submit: function () {
		this.done = true
		this.aborted = false
		this.render()
		this.out.write('\n')
		this.close()
	},

	first: function () {
		this.moveCursor(0)
		this.render()
	},
	last: function () {
		this.moveCursor(this.values.length - 1)
		this.render()
	},

	up: function () {
		if (this.cursor === 0) return this.bell()
		this.moveCursor(this.cursor - 1)
		this.render()
	},
	down: function () {
		if (this.cursor === (this.values.length - 1)) return this.bell()
		this.moveCursor(this.cursor + 1)
		this.render()
	},

	_: function (c) { // todo
	},



	render: function (first) {
		if (first) this.out.write(esc.cursorHide)

		// todo
	}
}

const ui = (path) => {
	if ('string' !== typeof path) throw new Error('path must be string.')

	// todo: open leveldb

	const ui = Object.create(UI)
	ui.values = []
	ui.value = null
	ui.cursor = 0
	ui.done = false
	ui.aborted = false

	return wrap(ui)
}

module.exports = ui
