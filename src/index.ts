import * as process from 'process';
import * as yargs from 'yargs';
import { bold, red } from 'chalk';

const packageJson: { version: string; } = require('../package.json');

console.log();
console.log(bold('bubba – Making Eric\'s life easier'));
console.log();

// Check to ensure that the GitHub authorization token is available in the environment
if (!process.env['GITHUB_TOKEN']) {
	console.error(red('Error! Cannot find "GITHUB_TOKEN" in environment.'));
	process.exit(1);
}

yargs
	.usage('usage: $0 <command>')
	.commandDir('commands', {
		extensions: [ 'js', 'ts' ]
	})
	.demandCommand(1, 'At least one command required\n')
	.version('version', 'Show version information', `Version ${packageJson.version}\n`)
	.alias('version', 'v')
	.help()
	.wrap(80)
	.argv;
