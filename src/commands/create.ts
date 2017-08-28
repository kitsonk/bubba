import { CommandBuilder } from 'yargs';

export const command = 'create <command>';

export const describe = 'create some sort of object';

export const builder: CommandBuilder = function (yargs) {
	return yargs
		.commandDir('create_commands', {
			extensions: [ 'js', 'ts' ]
		});
};

export function handler () {}
