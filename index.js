'use strict'

const esc = require('ansi-escapes')
const termSize = require('window-size').get
const chalk = require('chalk')
const styles = require('cli-styles')
const splitLines = require('split-lines')
const stripAnsi = require('strip-ansi')
const path = require('path')
const wrap = require('prompt-skeleton')

const createSlice = require('./lib/slice')

const noop = () => {}

const UI = {
	moveCursor: function (n) {
		this.cursor = n
		this.value = this.entries[n].value
	},

	reset: function () {
		this.moveCursor(0)
		this.render()
	},
	abort: function () {
		this.aborted = true
		this.quit({}, true)
	},
	quit: function (_, cb = noop) {
		this.done = true
		this.out.write('')
		this.close()
		cb()
	},

	first: function (_, cb = noop) {
		this.moveCursor(0)
		this.render()
		cb()
	},
	last: function (_, cb = noop) {
		this.moveCursor(this.entries.length - 1)
		this.render()
		cb()
	},

	up: function (_, cb = noop) {
		if (this.cursor <= 0) return this.bell()
		this.moveCursor(this.cursor - 1)
		this.render()
		cb()
	},
	down: function (_, cb = noop) {
		if (this.cursor >= (this.entries.length - 1)) return this.bell()
		this.moveCursor(this.cursor + 1)
		this.render()
		cb()
	},

	delete: function () {
		if (this.queue) {
			if (this.queue.length === 0) this.queue = null
			else this.queue.pop()
			this.render()
		} else this._delete()
	},
	_delete: function (_, cb = noop) {
		const e = this.entries[this.cursor]
		if (!e) return this.bell()

		this.render()

		// todo: pending indicator
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

	queue: null,
	queueLock: false,
	processInput: function () {
		if (this.queueLock || !this.queue) return
		if (this.queue.length === 0) return;
		this.queueLock = true

		let cmd = this.queue.shift()
		cmd = this.commands[cmd] || this.bell

		const self = this
		cmd.call(this, {}, (err) => {
			this.queueLock = false
			if (err) {
				self.queue = null
				self.feedback(err, true)
				return;
			}
			if (self.queue.length === 0) self.queue = null
			else setImmediate(() => self.processInput())
			self.render()
		})
	},
	_: function (c) {
		if (this.queue) {
			if (c in this.commands) {
				this.queue.push(c)
				this.render()
			} else this.bell()
		} else if (c === ':') {
			this.queue = []
			this.render()
		} else if (this.commands[c]) {
			this.commands[c].call(this)
		} else this.bell()
	},
	submit: function () {
		if (!this.queue) return this.bell()

		const self = this
		this.processInput()
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

	render: function () {
		const {height} = termSize()

		let out = ''
		if (this.entries.length > 0) {
			const entries = this.entries.slice(0, height - 2)
			for (let i = 0; i < entries.length; i++) {
				const e = entries[i]

				out += [
					i === this.cursor ? chalk.blue(e.key) : e.key,
					chalk.gray(e.value)
				].join(' ') + '\n'
			}
		} else out += chalk.red('no entries') + '\n'

		const msg = this.message
		if (msg !== null) {
			out += this.msgIsError
				? chalk.bgRed.black(msg)
				: chalk.bgGreen.black(msg)
		} else if (this.queue) {
			out += chalk.bgBlue.black(':' + this.queue.join(''))
		} else {
			out += chalk.bgGreen.black(this.dbName)
		}

		this.out.write(out)
	},

	onError: (err) => {
		this.value = err
		this.abort()
	},
}

UI.commands = {
	d: UI._delete,
	q: UI.quit,
	j: UI.down,
	k: UI.up,
	H: UI.first,
	L: UI.last
}

const defaults = {
	value: null,
	done: false,
	aborted: false
}

const mapEntry = ([key, value]) => ({
	rawKey: key,
	key: stripAnsi(key),
	value: stripAnsi(value)
})

const ui = (db, dbPath) => {
	if ('object' !== typeof db || db === null) throw new TypeError('db must be an object.')
	if ('string' !== typeof dbPath) throw new TypeError('dbPath must be string.')

	const ui = Object.assign(Object.create(UI), defaults)
	ui.db = db
	ui.dbName = path.basename(dbPath)

	const slice = ui.slice = createSlice(db, mapEntry)

	ui.entries = []
	ui.cursor = 0

	slice.on('change', (entries) => {
		ui.entries = entries
		if (entries.length > 0) {
			ui.moveCursor(Math.min(ui.cursor, entries.length - 1))
		}
		ui.render()
	})
	setImmediate(() => {
		slice.move('down', 100)
		.catch(err => ui.onError(err))
	})

	const out = wrap(ui)
	return out
}

module.exports = ui
