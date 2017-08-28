#!/usr/bin/env node

var tsconfig = require('./tsconfig.json');

require('ts-node')
	.register(tsconfig);

module.exports = require('./lib/index');
