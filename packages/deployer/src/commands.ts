import { migrator } from './migrations/migrate';
import { Compiler } from './compiler';
import { Deployer } from './deployer';
import { CompilerOptions, DeployerOptions } from './utils/types';

export const commands = {
	async compileAsync(opts: CompilerOptions): Promise<void> {
		const compiler = new Compiler(opts);
		await compiler.compileAllAsync();
	},
	async migrateAsync(opts: DeployerOptions): Promise<void> {
		const deployer = new Deployer(opts);
		await migrator.runMigrationsAsync(deployer);
	},
	async deployAsync(contractName: string, args: any[], opts: DeployerOptions): Promise<void> {
		const deployer = new Deployer(opts);
		await deployer.deployAndSaveAsync(contractName, args);
	},
};
