'use strict'

const esc = require('ansi-escapes')
const termSize = require('window-size').get
const chalk = require('chalk')
const styles = require('cli-styles')
const splitLines = require('split-lines')
const stripAnsi = require('strip-ansi')
const path = require('path')
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

	clear: '',
	render: function (first) {
		if (first) this.out.write(esc.cursorHide)

		const {width, height} = termSize()

		let out = ''
		if (this.entries.length > 0) {
			const entries = this.entries.slice(0, height - 1)
			for (let i = 0; i < entries.length; i++) {
				const e = entries[i]

				out += [
					i === this.cursor ? chalk.blue(e.key) : e.key,
					chalk.gray(e.value)
				].join(' ') + '\n'
			}
		} else out += chalk.red('no entries') + '\n'

		if (this.error) {
			const msg = this.error.message || splitLines(this.error + '')[0]
			out += chalk.bgRed.black(msg) + '\n'
		} else {
			out += chalk.bgGreen.black(this.dbName) + '\n'
		}

		this.out.write(this.clear + out)
		this.clear = styles.clear(out)
	}
}

const defaults = {
	value: null,
	error: null,
	done: false,
	aborted: false
}

// todo: strip ANSI
const mapEntry = (entry) => ({
	rawKey: entry.key,
	key: stripAnsi(entry.key),
	value: stripAnsi(entry.value)
})

const ui = (dbPath) => {
	if ('string' !== typeof dbPath) throw new Error('db path must be string.')

	const ui = Object.assign(Object.create(UI), defaults)
	ui.dbName = path.basename(dbPath)

	const db = ui.db = level(dbPath)
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
	setImmediate(slice.move, 'down', 100)

	let errorTimeout = null
	slice.on('error', (err) => {
		ui.error = err
		if (errorTimeout !== null) clearTimeout(errorTimeout)
		errorTimeout = setTimeout(clearError)
		ui.render()
	})
	const clearError = () => {
		ui.error = null
		ui.render()
	}

	return wrap(ui)
}

module.exports = ui
