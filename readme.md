# leveldb-editor

**Edit a [LevelDB](https://leveldb.org/) from the command line.**

*Note*: This tool is infinished. By now, it can only delete entries.

[![asciicast](https://asciinema.org/a/134893.png)](https://asciinema.org/a/134893)

[![npm version](https://img.shields.io/npm/v/leveldb-editor.svg)](https://www.npmjs.com/package/leveldb-editor)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/leveldb-editor.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## Installing

```shell
npm install -g leveldb-editor
```

You may want to run `leveldb-editor` using [npx](https://www.npmjs.com/package/npx).


## Usage

```shell
Usage:
    leveldb-editor [--value-encoding <env>] <path-to-leveldb>
Options:
    --value-encoding -e  How the values are encoded in the db. Default: utf8
Examples:
    leveldb-editor foo/bar/data.leveldb
```


## Contributing

If you have a question or have difficulties using `leveldb-editor`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/leveldb-editor/issues).
