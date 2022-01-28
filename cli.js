#!/usr/bin/env node
'use strict'

const mri = require('mri')

const pkg = require('./package.json')
const ui = require('.')

const argv = mri(process.argv.slice(2), {
	boolean: ['help', 'h', 'version', 'v']
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    leveldb-editor [--value-encoding <env>] <path-to-leveldb>
Options:
    --value-encoding -e  How the values are encoded in the db. Default: utf8
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
	console.error(err.message || err + '')
	process.exit(1)
}

const path = argv._[0]
if (!path) showError('You must provide a path.')

ui(path)
.catch(showError)
