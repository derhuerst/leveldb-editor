'use strict'

const {EventEmitter} = require('events')

const noop = () => {}

const createSlice = (db, map) => {
	const out = new EventEmitter()
	let entries = []
	let cursor = null

	const move = out.move = (direction, count, cb = noop) => {
		const opt = {limit: count}
		if (direction === 'up') {
			opt.lt = cursor
			opt.reverse = true
		} else if (direction === 'down') opt.gt = cursor
		else throw new Error('invalid direction, only up or down')

		const vals = db.createReadStream(opt)
		const newEntries = []
		let newCursor = cursor
		vals.on('data', (entry) => {
			newCursor = entry.key
			try {
				const e = map(entry)
				newEntries.push(e)
			} catch (err) {
				out.emit('error', err)
			}
		})

		vals.once('error', (err) => {
			vals.destroy()
			setImmediate(cb, err)
			setImmediate(() => {
				out.emit('error', err)
			})
		})
		vals.once('end', () => {
			entries = newEntries
			cursor = newCursor
			setImmediate(cb, null, newEntries)
			setImmediate(() => {
				out.emit('move', newEntries)
			})
		})
	}

	return out
}

module.exports = createSlice
