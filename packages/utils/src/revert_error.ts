import { ObjectMap } from '@0x/types';
import { DataItem, RevertErrorAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import { inspect } from 'util';

import * as AbiEncoder from './abi_encoder';
import { BigNumber } from './configured_bignumber';

// tslint:disable: max-classes-per-file

type ArgTypes = string | BigNumber | number | boolean;
type ValueMap = ObjectMap<ArgTypes | undefined>;
type RevertErrorDecoder = (hex: string) => ValueMap;

interface RevertErrorType {
    new (): RevertError;
}

interface RevertErrorRegistryItem {
    type: RevertErrorType;
    decoder: RevertErrorDecoder;
}

/**
 * Register a RevertError type so that it can be decoded by
 * `decodeRevertError`.
 * @param revertClass A class that inherits from RevertError.
 */
export function registerRevertErrorType(revertClass: RevertErrorType): void {
    RevertError.registerType(revertClass);
}

/**
 * Decode an ABI encoded revert error.
 * Throws if the data cannot be decoded as a known RevertError type.
 * @param bytes The ABI encoded revert error. Either a hex string or a Buffer.
 * @return A RevertError object.
 */
export function decodeRevertError(bytes: string | Buffer): RevertError {
    return RevertError.decode(bytes);
}

/**
 * Base type for revert errors.
 */
export abstract class RevertError extends Error {
    // Map of types registered via `registerType`.
    private static readonly _typeRegistry: ObjectMap<RevertErrorRegistryItem> = {};
    public abi: RevertErrorAbi;
    public values: ValueMap = {};

    /**
     * Decode an ABI encoded revert error.
     * Throws if the data cannot be decoded as a known RevertError type.
     * @param bytes The ABI encoded revert error. Either a hex string or a Buffer.
     * @return A RevertError object.
     */
    public static decode(bytes: string | Buffer): RevertError {
        const _bytes = bytes instanceof Buffer ? ethUtil.bufferToHex(bytes) : ethUtil.addHexPrefix(bytes);
        // tslint:disable-next-line: custom-no-magic-numbers
        const selector = _bytes.slice(2, 10);
        const { decoder, type } = this._lookupType(selector);
        const instance = new type();
        try {
            const values = decoder(_bytes);
            return _.assign(instance, { values });
        } catch (err) {
            throw new Error(
                `Bytes ${_bytes} cannot be decoded as a revert error of type ${instance.signature}: ${err.message}`,
            );
        }
    }

    /**
     * Register a RevertError type so that it can be decoded by
     * `RevertError.decode`.
     * @param revertClass A class that inherits from RevertError.
     */
    public static registerType(revertClass: RevertErrorType): void {
        const instance = new revertClass();
        if (instance.selector in RevertError._typeRegistry) {
            throw new Error(`RevertError type with signature "${instance.signature}" is already registered`);
        }
        RevertError._typeRegistry[instance.selector] = {
            type: revertClass,
            decoder: createDecoder(instance.abi),
        };
    }

    // Ge tthe registry info given a selector.
    private static _lookupType(selector: string): RevertErrorRegistryItem {
        if (selector in RevertError._typeRegistry) {
            return RevertError._typeRegistry[selector];
        }
        throw new Error(`Unknown revert error selector "${selector}"`);
    }

    /**
     * Create a RevertError instance with optional parameter values.
     * Parameters that are left undefined will not be tested in equality checks.
     * @param declaration Function-style declaration of the revert (e.g., Error(string message))
     * @param values Optional mapping of parameters to values.
     */
    protected constructor(declaration: string, values?: ValueMap) {
        super();
        this.abi = declarationToAbi(declaration);
        if (values !== undefined) {
            _.assign(this.values, _.cloneDeep(values));
        }
        // Extending Error is tricky; we need to explicitly set the prototype.
        Object.setPrototypeOf(this, new.target.prototype);
        this.message = this.toString();
    }

    /**
     * Get the ABI name for this revert.
     */
    get name(): string {
        return this.abi.name;
    }

    /**
     * Get the hex selector for this revert (without leading '0x').
     */
    get selector(): string {
        return toSelector(this.abi);
    }

    /**
     * Get the signature for this revert: e.g., 'Error(string)'.
     */
    get signature(): string {
        return toSignature(this.abi);
    }

    /**
     * Get the ABI arguments for this revert.
     */
    get arguments(): DataItem[] {
        return this.abi.arguments || [];
    }

    /**
     * Compares this instance with another.
     * Fails if instances are not of the same type.
     * Only fields/values defined in both instances are compared.
     * @param other Either another RevertError instance, hex-encoded bytes, or a Buffer of the ABI encoded revert.
     * @return True if both instances match.
     */
    public equals(other: RevertError | Buffer | string): boolean {
        let _other = other;
        if (_other instanceof Buffer) {
            _other = ethUtil.bufferToHex(_other);
        }
        if (typeof _other === 'string') {
            _other = RevertError.decode(_other);
        }
        if (this.constructor !== _other.constructor) {
            return false;
        }
        for (const name of Object.keys(this.values)) {
            const a = this.values[name];
            const b = _other.values[name];
            if (a === b) {
                continue;
            }
            if (!_.isNil(a) && !_.isNil(b)) {
                const { type } = this._getArgumentByName(name);
                if (!checkArgEquality(type, a, b)) {
                    return false;
                }
            }
        }
        return true;
    }

    public toString(): string {
        const values = _.omitBy(this.values, (v: any) => _.isNil(v));
        const inner = _.isEmpty(values) ? '' : inspect(values);
        return `${this.constructor.name}(${inner})`;
    }

    private _getArgumentByName(name: string): DataItem {
        const arg = _.find(this.arguments, (a: DataItem) => a.name === name);
        if (_.isNil(arg)) {
            throw new Error(`RevertError ${this.signature} has no argument named ${name}`);
        }
        return arg;
    }
}

export class StringRevertError extends RevertError {
    constructor(message?: string) {
        super('Error(string message)', { message });
    }
}

/**
 * Parse a solidity function declaration into a RevertErrorAbi object.
 * @param declaration Function declaration (e.g., 'foo(uint256 bar)').
 * @return A RevertErrorAbi object.
 */
function declarationToAbi(declaration: string): RevertErrorAbi {
    let m = /^\s*([_a-z][a-z0-9_]*)\((.*)\)\s*$/i.exec(declaration);
    if (!m) {
        throw new Error(`Invalid Revert Error signature: "${declaration}"`);
    }
    const [name, args] = m.slice(1);
    const argList: string[] = _.filter(args.split(','));
    const argData: DataItem[] = _.map(argList, (a: string) => {
        m = /^\s*([_a-z][a-z0-9_]*)\s+([_a-z][a-z0-9_]*)\s*$/i.exec(a);
        if (!m) {
            throw new Error(`Invalid Revert Error signature: "${declaration}"`);
        }
        return {
            name: m[2],
            type: m[1],
        };
    });
    const r: RevertErrorAbi = {
        type: 'error',
        name,
        arguments: _.isEmpty(argData) ? [] : argData,
    };
    return r;
}

function checkArgEquality(type: string, lhs: ArgTypes, rhs: ArgTypes): boolean {
    if (type === 'address') {
        return normalizeAddress(lhs as string) === normalizeAddress(rhs as string);
    } else if (type.startsWith('bytes')) {
        return normalizeBytes(lhs as string) === normalizeBytes(rhs as string);
    } else if (type === 'string') {
        return lhs === rhs;
    }
    // tslint:disable-next-line
    return new BigNumber((lhs as any) || 0).eq(rhs as any);
}

function normalizeAddress(addr: string): string {
    const ADDRESS_SIZE = 20;
    return ethUtil.bufferToHex(ethUtil.setLengthLeft(ethUtil.toBuffer(ethUtil.addHexPrefix(addr)), ADDRESS_SIZE));
}

function normalizeBytes(bytes: string): string {
    return ethUtil.addHexPrefix(bytes).toLowerCase();
}

function createDecoder(abi: RevertErrorAbi): (hex: string) => ValueMap {
    const encoder = AbiEncoder.createMethod(abi.name, abi.arguments || []);
    return (hex: string): ValueMap => {
        // tslint:disable-next-line
        return encoder.decode(hex) as ValueMap;
    };
}

function toSignature(abi: RevertErrorAbi): string {
    const argTypes = _.map(abi.arguments, (a: DataItem) => a.type);
    const args = argTypes.join(',');
    return `${abi.name}(${args})`;
}

function toSelector(abi: RevertErrorAbi): string {
    return (
        ethUtil
            .sha3(Buffer.from(toSignature(abi)))
            // tslint:disable-next-line: custom-no-magic-numbers
            .slice(0, 4)
            .toString('hex')
    );
}

// Register StringRevertError
RevertError.registerType(StringRevertError);
