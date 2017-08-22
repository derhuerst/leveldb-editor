#!/usr/bin/env node
'use strict'

const mri = require('mri')

const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: ['help', 'h', 'version', 'v']
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    leveldb-editor <path-to-leveldb>
Examples:
    leveldb-editor foo/bar/data.leveldb
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`leveldb-editor v${pkg.version}\n`)
	process.exit(0)
}

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

// todo
