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

		const slice = db.createReadStream(opt)
		const newEntries = []
		let newCursor = cursor

		const onError = (err) => {
			slice.destroy()
			setImmediate(cb, err)
			setImmediate(() => {
				out.emit('error', err)
			})
		}
		slice.once('error', onError)

		slice.on('data', (entry) => {
			newCursor = entry.key
			try {
				const e = map(entry)
				newEntries.push(e)
			} catch (err) {
				onError(err)
			}
		})
		slice.once('end', () => {
			entries = newEntries
			cursor = newCursor
			setImmediate(cb, null, newEntries, newCursor)
			setImmediate(() => {
				out.emit('move', newEntries, newCursor)
			})
		})
	}

	return out
}

module.exports = createSlice
