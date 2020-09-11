import * as _ from 'lodash';

import { ERC20BridgeSource } from './types';

export class SourceFilters {
    // All valid sources.
    private readonly _validSources: ERC20BridgeSource[];
    // Sources in `_validSources` that are not allowed.
    private readonly _excludedSources: ERC20BridgeSource[];
    // Sources in `_validSources` that are only allowed.
    private readonly _includedSources: ERC20BridgeSource[];

    constructor(
        validSources: ERC20BridgeSource[] = [],
        excludedSources: ERC20BridgeSource[] = [],
        includedSources: ERC20BridgeSource[] = [],
    ) {
        this._validSources = _.uniq(validSources);
        this._excludedSources = _.uniq(excludedSources);
        this._includedSources = _.uniq(includedSources);
    }

    public isAllowed(source: ERC20BridgeSource): boolean {
        // Must be in list of valid sources.
        if (this._validSources.length > 0 && !this._validSources.includes(source)) {
            return false;
        }
        // Must not be excluded.
        if (this._excludedSources.includes(source)) {
            return false;
        }
        // If we have an inclusion list, it must be in that list.
        if (this._includedSources.length > 0 && !this._includedSources.includes(source)) {
            return false;
        }
        return true;
    }

    public areAnyAllowed(sources: ERC20BridgeSource[]): boolean {
        return sources.some(s => this.isAllowed(s));
    }

    public areAllAllowed(sources: ERC20BridgeSource[]): boolean {
        return sources.every(s => this.isAllowed(s));
    }

    public getAllowed(sources: ERC20BridgeSource[] = []): ERC20BridgeSource[] {
        return sources.filter(s => this.isAllowed(s));
    }

    public get sources(): ERC20BridgeSource[] {
        return this._validSources.filter(s => this.isAllowed(s));
    }

    public exclude(sources: ERC20BridgeSource | ERC20BridgeSource[]): SourceFilters {
        return new SourceFilters(
            this._validSources,
            [...this._excludedSources, ...(Array.isArray(sources) ? sources : [sources])],
            this._includedSources,
        );
    }

    public include(sources: ERC20BridgeSource | ERC20BridgeSource[]): SourceFilters {
        return new SourceFilters(this._validSources, this._excludedSources, [
            ...this._includedSources,
            ...(Array.isArray(sources) ? sources : [sources]),
        ]);
    }

    public merge(other: SourceFilters): SourceFilters {
        let validSources = this._validSources;
        if (validSources.length === 0) {
            validSources = other._validSources;
        } else if (other._validSources.length !== 0) {
            validSources = validSources.filter(s => other._validSources.includes(s));
        }
        return new SourceFilters(
            validSources,
            [...this._excludedSources, ...other._excludedSources],
            [...this._includedSources, ...other._includedSources],
        );
    }
}
