#!/usr/bin/env node

var tsconfig = require('./tsconfig.json');

require('ts-node')
	.register({
		'compilerOptions': {
			'module': 'commonjs',
			'noUnusedLocals': true,
			'strict': true,
			'target': 'es2016',
			'typeRoots': [
				'node_modules/@types'
			]
		}
	});

module.exports = require('./lib/index');
