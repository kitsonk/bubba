import { CommandBuilder } from 'yargs';

export const command = 'delete <command>';

export const describe = 'delete some sort of object';

export const builder: CommandBuilder = function(yargs) {
	return yargs.commandDir('delete_commands', {
		extensions: ['js', 'ts']
	});
};

export function handler() {}
