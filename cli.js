#!/usr/bin/env node

const tsconfig = require('./tsconfig.json');

require('ts-node').register(tsconfig);

module.exports = require('./src/index');
