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

const noop = () => {}

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
		this.out.write(esc.clearScreen)
		this.close()
	},
	submit: function () {
		this.done = true
		this.aborted = false
		this.out.write(esc.clearScreen)
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

	delete: function (cb = noop) {
		const e = this.entries[this.cursor]
		if (!e) return this.bell()

		e.pending = true
		this.render()

		const self = this
		this.db.del(e.rawKey, (err) => {
			if (err) {
				self.feedback(err, true)
				setImmediate(cb, err)
				return
			}

			const i = self.entries.indexOf(e)
			self.entries = self.entries.slice() // clone
			self.entries.splice(i, 1) // delete

			self.feedback(e.key + ' deleted.', false)
			setImmediate(cb)
		})
	},

	_: function (c) {
		if (c === 'd') this.delete()
		else if (c === 'q') this.submit() // quit
		// todo
	},

	message: null,
	msgIsError: false,
	msgTimeout: null,
	feedback: function (msg, isError) {
		const self = this
		if (this.msgTimeout !== null) clearTimeout(this.msgTimeout)
		this.msgTimeout = setTimeout(() => {
			self.message = null
			self.msgIsError = false
			self.msgTimeout = null
			self.render()
		}, 2 * 1000)

		this.message = splitLines(msg.message || msg + '')[0]
		this.msgIsError = isError
		this.render()
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
					chalk.gray(e.value),
					i
				].join(' ') + '\n'
			}
		} else out += chalk.red('no entries') + '\n'

		const msg = this.message
		if (msg !== null) {
			out += this.msgIsError
				? chalk.bgRed.black(msg)
				: chalk.bgGreen.black(msg)
		} else {
			out += chalk.bgGreen.black(this.dbName)
		}

		this.out.write(this.clear + out)
		this.clear = styles.clear(out)
	}
}

const defaults = {
	value: null,
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

	slice.on('error', (err) => ui.onError(err))
	slice.on('move', (entries) => {
		ui.entries = entries
		if (entries.length > 0) {
			ui.moveCursor(Math.min(ui.cursor, entries.length - 1))
		}
		ui.render()
	})
	setImmediate(slice.move, 'down', 100)

	return wrap(ui)
}

module.exports = ui
