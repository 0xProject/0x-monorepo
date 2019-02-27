import { ObjectMap, OrderStatus } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { DataItem, RichRevertAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import { inspect } from 'util';

type ArgTypes = string | BigNumber | number | boolean;
type ValueMap = ObjectMap<ArgTypes | undefined>;
type Decoder = (hex: string) => ValueMap;

// tslint:disable:max-classes-per-file custom-no-magic-numbers

export enum FillErrorCodes {
    InvalidTakerAmount,
    TakerOverpay,
    Overfill,
    InvalidFillPrice,
}

export enum SignatureErrorCodes {
    BadSignature,
    InvalidLength,
    Unsupported,
    Illegal,
    WalletError,
    ValidatorError,
}

export enum AssetProxyDispatchErrorCodes {
    InvalidAssetDataLength,
    UnknownAssetProxy,
}

export enum TransactionExecutionErrorCodes {
    NoReentrancy,
    AlreadyExecuted,
    BadSignature,
    FailedExecution,
}

const ADDRESS_SIZE = 20;

/**
 * Base type for rich revert reasons.
 */
export abstract class RichRevertReason {
    public abi: RichRevertAbi;
    public values: ValueMap = {};

    /**
     * Decode arbitrary bytes into a known rich revert reason object.
     * Will throw if decoding fails.
     * @param bytes Either a hex-encoded byte string or buffer.
     * @return The specific RichRevertReason instance.
     */
    public static decode(bytes: string | Buffer): RichRevertReason {
        return decodeRevertReason(bytes);
    }

    protected constructor(abi: RichRevertAbi, values?: ValueMap) {
        this.abi = abi;
        if (values) {
            this.values = _.cloneDeep(values);
        }
    }

    /**
     * Get the ABI name for this reason.
     */
    get name(): string {
        return this.abi.name;
    }

    /**
     * Get the hex selector for this reason (without leading '0x').
     */
    get selector(): string {
        return toSelector(this.abi);
    }

    /**
     * Get the signature for this reason: e.g., 'Error(string)'.
     */
    get signature(): string {
        return toSignature(this.abi);
    }

    /**
     * Get the ABI arguments for this reason.
     */
    get arguments(): DataItem[] {
        return this.abi.arguments || [];
    }

    protected _getArgumentByName(name: string): DataItem {
        const arg = _.find(this.arguments, a => a.name === name);
        if (!arg) {
            throw new Error(`RichRevertReason ${this.signature} has no argument named ${name}`);
        }
        return arg;
    }

    /**
     * Compares this instance with another.
     * Fails if instances are not of the same type.
     * Only fields/values present in both instances are compared.
     * @param other Either another RichRevertReason instance, hex-encoded bytes, or a Buffer of the ABI encoded reason.
     * @return True if both instances match.
     */
    public equals(other: RichRevertReason | Buffer | string): boolean {
        let _other = other;
        if (_other instanceof Buffer) {
            _other = ethUtil.bufferToHex(_other);
        }
        if (typeof _other === 'string') {
            _other = decodeRevertReason(_other);
        }
        if (this.constructor !== _other.constructor) {
            return false;
        }
        for (const name of Object.keys(this.values)) {
            const a = this.values[name];
            if (!_.isNil(a) && !(name in _other.values)) {
                return false;
            }
            const b = _other.values[name];
            // If one is nil and the other isn't, it isn't a match.
            if ((_.isNil(a) && !_.isNil(b)) || (!_.isNil(a) && _.isNil(b))) {
                return false;
            }
            if (!_.isNil(a) && !_.isNil(b)) {
                const { type } = this._getArgumentByName(name);
                if (!checkArgEquality(type, a, b)) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    public toString(): string {
        const values = _.omitBy(this.values, v => _.isNil(v));
        const inner = _.isEmpty(values) ? '' : inspect(values);
        return `${this.constructor.name}(${inner})`;
    }
}

export class StandardError extends RichRevertReason {
    constructor(message?: string) {
        super(declarationToAbi('Error(string message)'), { message });
    }
}

export class SignatureError extends RichRevertReason {
    constructor(orderHash?: string, error?: SignatureErrorCodes) {
        super(declarationToAbi('SignatureError(bytes32 orderHash, uint8 error)'), {
            orderHash,
            error,
        });
    }
}

export class OrderStatusError extends RichRevertReason {
    constructor(orderHash?: string, status?: OrderStatus) {
        super(declarationToAbi('OrderStatusError(bytes32 orderHash, uint8 status)'), { orderHash, status });
    }
}

export class InvalidSenderError extends RichRevertReason {
    constructor(orderHash?: string, sender?: string) {
        super(declarationToAbi('InvalidSenderError(bytes32 orderHash, address sender)'), {
            orderHash,
            sender,
        });
    }
}

export class InvalidTakerError extends RichRevertReason {
    constructor(orderHash?: string, taker?: string) {
        super(declarationToAbi('InvalidTakerError(bytes32 orderHash, address taker)'), {
            orderHash,
            taker,
        });
    }
}

export class InvalidMakerError extends RichRevertReason {
    constructor(orderHash?: string, maker?: string) {
        super(declarationToAbi('InvalidMakerError(bytes32 orderHash, address maker)'), {
            orderHash,
            maker,
        });
    }
}

export class FillError extends RichRevertReason {
    constructor(orderHash?: string, error?: FillErrorCodes) {
        super(declarationToAbi('FillError(bytes32 orderHash, uint8 error)'), { orderHash, error });
    }
}

export class EpochOrderError extends RichRevertReason {
    constructor(maker?: string, sender?: string, currentEpoch?: BigNumber | number | string) {
        super(declarationToAbi('EpochOrderError(address maker, address sender, uint256 currentEpoch)'), {
            maker,
            sender,
            currentEpoch,
        });
    }
}

export class AssetProxyExistsError extends RichRevertReason {
    constructor(proxy?: string) {
        super(declarationToAbi('AssetProxyExistsError(address proxy)'), { proxy });
    }
}

export class AssetProxyDispatchError extends RichRevertReason {
    constructor(error?: AssetProxyDispatchErrorCodes) {
        super(declarationToAbi('AssetProxyDispatchError(uint8 error)'), { error });
    }
}

export class NegativeSpreadError extends RichRevertReason {
    constructor(leftOrderHash?: string, rightOrderHash?: string) {
        super(declarationToAbi('NegativeSpreadError(bytes32 leftOrderHash, bytes32 rightOrderHash)'), {
            leftOrderHash,
            rightOrderHash,
        });
    }
}

export class TransactionExecutionError extends RichRevertReason {
    constructor(error?: TransactionExecutionErrorCodes) {
        super(declarationToAbi('TransactionExecutionError(uint8 error)'), { error });
    }
}

export class IncompleteFillError extends RichRevertReason {
    constructor(orderHash?: string) {
        super(declarationToAbi('IncompleteFillError(bytes32 orderHash)'), { orderHash });
    }
}

const RICH_REVERT_REGISTRY: RichRevertReason[] = [
    new StandardError(),
    new OrderStatusError(),
    new SignatureError(),
    new InvalidSenderError(),
    new InvalidTakerError(),
    new InvalidMakerError(),
    new FillError(),
    new EpochOrderError(),
    new AssetProxyExistsError(),
    new AssetProxyDispatchError(),
    new NegativeSpreadError(),
    new TransactionExecutionError(),
    new IncompleteFillError(),
];

const RICH_REVERT_LUT: ObjectMap<RichRevertReason> = _.zipObject(
    _.map(RICH_REVERT_REGISTRY, r => r.selector),
    RICH_REVERT_REGISTRY,
);

const DECODER_CACHE: ObjectMap<Decoder> = _.zipObject(
    _.map(RICH_REVERT_REGISTRY, r => r.selector),
    _.map(RICH_REVERT_REGISTRY, r => createDecoder(r.abi)),
);

function checkArgEquality(type: string, a: ArgTypes, b: ArgTypes): boolean {
    if (type === 'address') {
        return normalizeAddress(a as string) === normalizeAddress(b as string);
    } else if (type.startsWith('bytes')) {
        return normalizeBytes(a as string) === normalizeBytes(b as string);
    } else if (type === 'string') {
        return a === b;
    }
    // tslint:disable-next-line
    return new BigNumber((a as any) || 0).eq(b as any);
}

function normalizeAddress(addr: string): string {
    return ethUtil.bufferToHex(ethUtil.setLengthLeft(ethUtil.toBuffer(ethUtil.addHexPrefix(addr)), ADDRESS_SIZE));
}

function normalizeBytes(bytes: string): string {
    return ethUtil.addHexPrefix(bytes).toLowerCase();
}

function shortenHex(hex: string, maxBytes: number = 4): string {
    const _hex = ethUtil.addHexPrefix(hex);
    if (_hex.length > maxBytes * 2 + 2) {
        const shortened = _hex.slice(0, maxBytes * 2 + 2);
        return `${shortened}...`;
    }
    return _hex;
}

function createDecoder(abi: RichRevertAbi): (hex: string) => ValueMap {
    const encoder = AbiEncoder.createMethod(abi.name, abi.arguments || []);
    return (hex: string): ValueMap => {
        // tslint:disable-next-line
        return encoder.decode(hex) as ValueMap;
    };
}

function declarationToAbi(decl: string): RichRevertAbi {
    let m = /^\s*([_a-z][a-z0-9_]*)\((.*)\)\s*$/i.exec(decl);
    if (!m) {
        throw new Error(`Invalid Revert Error signature: "${decl}"`);
    }
    const [name, args] = m.slice(1);
    const argList: string[] = _.filter(args.split(','));
    const argData: DataItem[] = _.map(argList, (a: string) => {
        m = /^\s*([_a-z][a-z0-9_]*)\s+([_a-z][a-z0-9_]*)\s*$/i.exec(a);
        if (!m) {
            throw new Error(`Invalid Revert Error signature: "${decl}"`);
        }
        return {
            name: m[2],
            type: m[1],
        };
    });
    const r: RichRevertAbi = {
        type: 'error',
        name,
        arguments: _.isEmpty(argData) ? [] : argData,
    };
    return r;
}

function getDecoder(abiOrSelector: RichRevertAbi | string): Decoder {
    let selector: string = '';
    if (typeof abiOrSelector === 'string') {
        selector = abiOrSelector;
        if (!(selector in DECODER_CACHE)) {
            throw new Error(`Unknown rich revert selector ${selector}`);
        }
    } else {
        selector = toSelector(abiOrSelector);
        if (!(selector in DECODER_CACHE)) {
            DECODER_CACHE[selector] = createDecoder(abiOrSelector);
        }
    }
    return DECODER_CACHE[selector];
}

function toSignature(abi: RichRevertAbi): string {
    const argTypes = _.map(abi.arguments, (a: DataItem) => a.type);
    const args = argTypes.join(',');
    return `${abi.name}(${args})`;
}

function toSelector(abi: RichRevertAbi): string {
    return ethUtil
        .sha3(Buffer.from(toSignature(abi)))
        .slice(0, 4)
        .toString('hex');
}

function decodeRevertReason(bytes: string | Buffer): RichRevertReason {
    let _bytes = bytes;
    if (_bytes instanceof Buffer) {
        _bytes = ethUtil.bufferToHex(_bytes);
    }
    _bytes = ethUtil.addHexPrefix(_bytes);
    const selector = _bytes.slice(2, 10);
    const decoder = getDecoder(selector);
    const proto = RICH_REVERT_LUT[selector];
    try {
        const values = decoder(_bytes);
        return _.assign(_.clone(proto), { values });
    } catch (err) {
        throw new Error(
            `Bytes ${shortenHex(_bytes)} cannot be decoded as rich revert ${proto.signature}: ${err.message}`,
        );
    }
}
