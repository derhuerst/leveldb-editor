'use strict'

const esc = require('ansi-escapes')
const wrap = require('prompt-skeleton')
const level = require('level')

const createSlice = require('./lib/slice')

const UI = {
	moveCursor: function (n) {
		this.cursor = n
		this.value = this.entries[n].value
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
		this.moveCursor(this.entries.length - 1)
		this.render()
	},

	up: function () {
		if (this.cursor <= 0) return this.bell()
		this.moveCursor(this.cursor - 1)
		this.render()
	},
	down: function () {
		if (this.cursor >= (this.entries.length - 1)) return this.bell()
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

const mapEntry = (entry) => entry // todo: strip ANSI

const ui = (path) => {
	if ('string' !== typeof path) throw new Error('path must be string.')

	const ui = Object.create(UI)
	ui.value = null
	ui.done = false
	ui.aborted = false

	const db = ui.db = level(path)
	const slice = ui.slice = createSlice(db, mapEntry)

	ui.entries = []
	ui.cursor = 0
	slice.on('move', (entries) => {
		ui.entries = entries
		if (entries.length > 0) {
			ui.moveCursor(Math.min(ui.cursor, entries.length - 1))
		}
		ui.render()
	})
	// todo: slice.on('error', …)
	setImmediate(slice.move, 'down', 100)

	return wrap(ui)
}

module.exports = ui
