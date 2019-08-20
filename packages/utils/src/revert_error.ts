import { ObjectMap } from '@0x/types';
import { DataItem, RevertErrorAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import { inspect } from 'util';

import * as AbiEncoder from './abi_encoder';
import { BigNumber } from './configured_bignumber';

// tslint:disable: max-classes-per-file

type ArgTypes = string | BigNumber | number | boolean | BigNumber[] | string[] | number[] | boolean[];
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
export function decodeBytesAsRevertError(bytes: string | Buffer): RevertError {
    return RevertError.decode(bytes);
}

/**
 * Decode a thrown error.
 * Throws if the data cannot be decoded as a known RevertError type.
 * @param error Any thrown error.
 * @return A RevertError object.
 */
export function decodeThrownErrorAsRevertError(error: Error): RevertError {
    if (error instanceof RevertError) {
        return error;
    }
    return RevertError.decode(getThrownErrorRevertErrorBytes(error));
}

/**
 * Coerce a thrown error into a `RevertError`. Always succeeds.
 * @param error Any thrown error.
 * @return A RevertError object.
 */
export function coerceThrownErrorAsRevertError(error: Error): RevertError {
    if (error instanceof RevertError) {
        return error;
    }
    try {
        return decodeThrownErrorAsRevertError(error);
    } catch (err) {
        if (isGanacheTransactionRevertError(error)) {
            return new AnyRevertError();
        }
        // Handle geth transaction reverts.
        if (isGethTransactionRevertError(error)) {
            // Geth transaction reverts are opaque, meaning no useful data is returned,
            // so we just return an AnyRevertError type.
            return new AnyRevertError();
        }
        // Coerce plain errors into a StringRevertError.
        return new StringRevertError(error.message);
    }
}

/**
 * Base type for revert errors.
 */
export abstract class RevertError extends Error {
    // Map of types registered via `registerType`.
    private static readonly _typeRegistry: ObjectMap<RevertErrorRegistryItem> = {};
    public readonly abi?: RevertErrorAbi;
    public readonly values: ValueMap = {};

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
        if (_.isNil(instance.abi)) {
            throw new Error(`Attempting to register a RevertError class with no ABI`);
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
    protected constructor(name: string, declaration?: string, values?: ValueMap) {
        super(createErrorMessage(name, values));
        if (declaration !== undefined) {
            this.abi = declarationToAbi(declaration);
            if (values !== undefined) {
                _.assign(this.values, _.cloneDeep(values));
            }
        }
        // Extending Error is tricky; we need to explicitly set the prototype.
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /**
     * Get the ABI name for this revert.
     */
    get name(): string {
        if (!_.isNil(this.abi)) {
            return this.abi.name;
        }
        return `<${this.typeName}>`;
    }

    /**
     * Get the class name of this type.
     */
    get typeName(): string {
        // tslint:disable-next-line: no-string-literal
        return this.constructor.name;
    }

    /**
     * Get the hex selector for this revert (without leading '0x').
     */
    get selector(): string {
        if (!_.isNil(this.abi)) {
            return toSelector(this.abi);
        }
        return '';
    }

    /**
     * Get the signature for this revert: e.g., 'Error(string)'.
     */
    get signature(): string {
        if (!_.isNil(this.abi)) {
            return toSignature(this.abi);
        }
        return '';
    }

    /**
     * Get the ABI arguments for this revert.
     */
    get arguments(): DataItem[] {
        if (!_.isNil(this.abi)) {
            return this.abi.arguments || [];
        }
        return [];
    }

    get [Symbol.toStringTag](): string {
        return this.toString();
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
        if (!(_other instanceof RevertError)) {
            return false;
        }
        // If either is of the `AnyRevertError` type, always succeed.
        if (this._isAnyType || _other._isAnyType) {
            return true;
        }
        // Must be of same type.
        if (this.constructor !== _other.constructor) {
            return false;
        }
        // Must share the same parameter values if defined in both instances.
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

    public encode(): string {
        if (!this._hasAllArgumentValues) {
            throw new Error(`Instance of ${this.typeName} does not have all its parameter values set.`);
        }
        const encoder = createEncoder(this.abi as RevertErrorAbi);
        return encoder(this.values);
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

    private get _isAnyType(): boolean {
        return _.isNil(this.abi);
    }

    private get _hasAllArgumentValues(): boolean {
        if (_.isNil(this.abi) || _.isNil(this.abi.arguments)) {
            return false;
        }
        for (const arg of this.abi.arguments) {
            if (_.isNil(this.values[arg.name])) {
                return false;
            }
        }
        return true;
    }
}

const GANACHE_TRANSACTION_REVERT_ERROR_MESSAGE = /^VM Exception while processing transaction: revert/;
const GETH_TRANSACTION_REVERT_ERROR_MESSAGE = /always failing transaction$/;

interface GanacheTransactionRevertResult {
    error: 'revert';
    program_counter: number;
    return?: string;
    reason?: string;
}

interface GanacheTransactionRevertError extends Error {
    results: { [hash: string]: GanacheTransactionRevertResult };
    hashes: string[];
}

/**
 * Try to extract the ecnoded revert error bytes from a thrown `Error`.
 */
export function getThrownErrorRevertErrorBytes(error: Error | GanacheTransactionRevertError): string {
    // Handle ganache transaction reverts.
    if (isGanacheTransactionRevertError(error)) {
        // Grab the first result attached.
        const result = error.results[error.hashes[0]];
        // If a reason is provided, just wrap it in a StringRevertError
        if (result.reason !== undefined) {
            return new StringRevertError(result.reason).encode();
        }
        if (result.return !== undefined && result.return !== '0x') {
            return result.return;
        }
    } else {
        // Handle geth transaction reverts.
        if (isGethTransactionRevertError(error)) {
            // Geth transaction reverts are opaque, meaning no useful data is returned,
            // so we do nothing.
        }
    }
    throw new Error(`Cannot decode thrown Errror "${error.message}" as a RevertError`);
}

function isGanacheTransactionRevertError(
    error: Error | GanacheTransactionRevertError,
): error is GanacheTransactionRevertError {
    if (GANACHE_TRANSACTION_REVERT_ERROR_MESSAGE.test(error.message) && 'hashes' in error && 'results' in error) {
        return true;
    }
    return false;
}

function isGethTransactionRevertError(error: Error | GanacheTransactionRevertError): boolean {
    return GETH_TRANSACTION_REVERT_ERROR_MESSAGE.test(error.message);
}

/**
 * RevertError type for standard string reverts.
 */
export class StringRevertError extends RevertError {
    constructor(message?: string) {
        super('StringRevertError', 'Error(string message)', { message });
    }
}

/**
 * Special RevertError type that matches with any other RevertError instance.
 */
export class AnyRevertError extends RevertError {
    constructor() {
        super('AnyRevertError');
    }
}

/**
 * Create an error message for a RevertError.
 * @param name The name of the RevertError.
 * @param values The values for the RevertError.
 */
function createErrorMessage(name: string, values?: ValueMap): string {
    if (values === undefined) {
        return `${name}()`;
    }
    const _values = _.omitBy(values, (v: any) => _.isNil(v));
    const inner = _.isEmpty(_values) ? '' : inspect(_values);
    return `${name}(${inner})`;
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
        // Match a function parameter in the format 'TYPE ID', where 'TYPE' may be
        // an array type.
        m = /^\s*(([_a-z][a-z0-9_]*)(\[\d*\])*)\s+([_a-z][a-z0-9_]*)\s*$/i.exec(a);
        if (!m) {
            throw new Error(`Invalid Revert Error signature: "${declaration}"`);
        }
        // tslint:disable: custom-no-magic-numbers
        return {
            name: m[4],
            type: m[1],
        };
        // tslint:enable: custom-no-magic-numbers
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
    } else if (type === 'bytes' || /^bytes(\d+)$/.test(type)) {
        return normalizeBytes(lhs as string) === normalizeBytes(rhs as string);
    } else if (type === 'string') {
        return lhs === rhs;
    } else if (/\[\d*\]$/.test(type)) { // An array type.
        // tslint:disable: custom-no-magic-numbers
        // Arguments must be arrays and have the same dimensions.
        if ((lhs as any[]).length !== (rhs as any[]).length) {
            return false;
        }
        const m = /^(.+)\[(\d*)\]$/.exec(type) as string[];
        const baseType = m[1];
        const isFixedLength = m[2].length !== 0;
        if (isFixedLength) {
            const length = parseInt(m[2], 10);
            // Fixed-size arrays have a fixed dimension.
            if ((lhs as any[]).length !== length) {
                return false;
            }
        }
        // Recurse into sub-elements.
        for (const [slhs, srhs] of _.zip(lhs as any[], rhs as any[])) {
            if (!checkArgEquality(baseType, slhs, srhs)) {
                return false;
            }
        }
        return true;
        // tslint:enable: no-magic-numbers
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

function createEncoder(abi: RevertErrorAbi): (values: ObjectMap<any>) => string {
    const encoder = AbiEncoder.createMethod(abi.name, abi.arguments || []);
    return (values: ObjectMap<any>): string => {
        const valuesArray = _.map(abi.arguments, (arg: DataItem) => values[arg.name]);
        return encoder.encode(valuesArray);
    };
}

function createDecoder(abi: RevertErrorAbi): (hex: string) => ValueMap {
    const encoder = AbiEncoder.createMethod(abi.name, abi.arguments || []);
    return (hex: string): ValueMap => {
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
