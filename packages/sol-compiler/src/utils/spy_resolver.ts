import { ResolverEngine } from '@resolver-engine/core';
import { ImportFile } from '@resolver-engine/imports';

export class SpyResolver extends ResolverEngine<ImportFile> {
    public resolvedContractSources: ImportFile[] = [];
    private readonly _resolver: ResolverEngine<ImportFile>;

    constructor(resolver: ResolverEngine<ImportFile>) {
        super();
        this._resolver = resolver;
    }

    // tslint:disable-next-line:async-suffix
    public async require(uri: string, workingDir?: string): Promise<ImportFile> {
        const resolvedFile = await this._resolver.require(uri, workingDir);
        this.resolvedContractSources.push(resolvedFile);
        return resolvedFile;
    }
}
