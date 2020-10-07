import * as _ from 'lodash';

import { CalldataBlock } from '../calldata_block';

export class SetCalldataBlock extends CalldataBlock {
    private _header: Buffer | undefined;
    private _members: CalldataBlock[];

    constructor(name: string, signature: string, parentName: string) {
        super(name, signature, parentName, 0, 0);
        this._members = [];
        this._header = undefined;
    }

    public getRawData(): Buffer {
        const rawDataComponents: Buffer[] = [];
        if (this._header !== undefined) {
            rawDataComponents.push(this._header);
        }
        _.each(this._members, (member: CalldataBlock) => {
            const memberBuffer = member.getRawData();
            rawDataComponents.push(memberBuffer);
        });
        const rawData = Buffer.concat(rawDataComponents);
        return rawData;
    }

    public setMembers(members: CalldataBlock[]): void {
        this._members = members;
    }

    public setHeader(header: Buffer): void {
        this._setHeaderSize(header.byteLength);
        this._header = header;
    }

    public toBuffer(): Buffer {
        if (this._header !== undefined) {
            return this._header;
        }
        return Buffer.from('');
    }

    public getMembers(): CalldataBlock[] {
        return this._members;
    }
}
