'use strict'

const {EventEmitter} = require('events')

const noop = () => {}

const createSlice = (db, map) => {
	const out = new EventEmitter()
	let cursor = null

	const move = async (direction, count) => {
		const opt = {limit: count}
		if (direction === 'up') {
			if (cursor !== null) opt.lt = cursor
			opt.reverse = true
		} else if (direction === 'down') {
			if (cursor !== null) opt.gt = cursor
		}
		else throw new Error('invalid direction, only up or down')

		const newEntries = []
		let newCursor = cursor
		for await (const entry of db.iterator(opt)) {
			const e = map(entry)
			newEntries.push(e)
			newCursor = entry.key
		}

		cursor = newCursor
		out.emit('change', newEntries)
	}

	out.move = move
	return out
}

module.exports = createSlice
