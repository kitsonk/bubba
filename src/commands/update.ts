import { CommandBuilder } from 'yargs';

export const command = 'update <command>';

export const describe = 'update some sort of object';

export const builder: CommandBuilder = function(yargs) {
	return yargs.commandDir('update_commands', {
		extensions: ['js', 'ts']
	});
};

export function handler() {}
