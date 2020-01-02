import { blockchainTests, constants, expect, signingUtils, transactionHashUtils } from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { EIP712DomainWithDefaultSchema, Order, SignatureType, ZeroExTransaction } from '@0x/types';
import { hexUtils, logUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { Actor, ActorConfig } from '../framework/actors/base';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';
import { TestSignatureValidationWalletContract } from '../wrappers';

// tslint:disable: max-classes-per-file no-non-null-assertion no-unnecessary-type-assertion

interface SignatureValidatorActorConfig extends ActorConfig {
    walletContractAddress: string;
    notWalletContractAddress: string;
}

class SignatureValidatorActor extends Actor {
    protected readonly _accounts: { [address: string]: Buffer };
    protected readonly _walletContractAddress: string;
    protected readonly _notWalletContractAddress: string;

    public constructor(config: SignatureValidatorActorConfig) {
        super(config);
        this.mixins.push('exchange/SignatureValidator');
        this._accounts = _.zipObject(
            this.deployment.accounts,
            this.deployment.accounts.map((a, i) => constants.TESTRPC_PRIVATE_KEYS[i]),
        );
        this._walletContractAddress = config.walletContractAddress;
        this._notWalletContractAddress = config.notWalletContractAddress;
    }

    protected async _presignHashAsync(signer: string, hash: string): Promise<void> {
        await this.deployment.exchange.preSign(hash).awaitTransactionSuccessAsync({ from: signer });
    }

    protected async _approveValidatorAsync(signer: string, validator: string, approved: boolean = true): Promise<void> {
        await this.deployment.exchange
            .setSignatureValidatorApproval(validator, approved)
            .awaitTransactionSuccessAsync({ from: signer });
    }
}

interface SignatureTestParams {
    signatureType: SignatureType;
    signer: string;
    signature: string;
    hash: string;
    signerKey?: Buffer;
    validator?: string;
    payload?: string;
    order?: Order;
    transaction?: ZeroExTransaction;
}

const ALL_SIGNATURE_TYPES = [
    SignatureType.Illegal,
    SignatureType.Invalid,
    SignatureType.EthSign,
    SignatureType.EIP712,
    SignatureType.Wallet,
    SignatureType.Validator,
    SignatureType.PreSigned,
    SignatureType.EIP1271Wallet,
];

const ALL_WORKING_SIGNATURE_TYPES = [
    SignatureType.EthSign,
    SignatureType.EIP712,
    SignatureType.Wallet,
    SignatureType.Validator,
    SignatureType.PreSigned,
    SignatureType.EIP1271Wallet,
];

const HASH_COMPATIBLE_SIGNATURE_TYPES = [
    SignatureType.EthSign,
    SignatureType.EIP712,
    SignatureType.Wallet,
    SignatureType.PreSigned,
];

const STATIC_SIGNATURE_TYPES = [SignatureType.EthSign, SignatureType.EIP712, SignatureType.PreSigned];

const ALWAYS_FAILING_SIGNATURE_TYPES = [SignatureType.Illegal, SignatureType.Invalid];

const WALLET_SIGNATURE_TYPES = [SignatureType.Wallet, SignatureType.EIP1271Wallet];

const STRICT_LENGTH_SIGNATURE_TYPES = [SignatureType.EthSign, SignatureType.EIP712];

const CALLBACK_SIGNATURE_TYPES = [SignatureType.Wallet, SignatureType.EIP1271Wallet, SignatureType.Validator];

function randomPayload(): string {
    return Pseudorandom.hex(Pseudorandom.integer(0, 66).toNumber());
}

function randomOrder(fields: Partial<Order> & { chainId: number; exchangeAddress: string }): Order {
    return {
        expirationTimeSeconds: Pseudorandom.integer(1, 2 ** 32),
        salt: Pseudorandom.integer(0, constants.MAX_UINT256),
        makerAssetData: Pseudorandom.hex(36),
        takerAssetData: Pseudorandom.hex(36),
        makerFeeAssetData: Pseudorandom.hex(36),
        takerFeeAssetData: Pseudorandom.hex(36),
        makerAssetAmount: Pseudorandom.integer(0, 100e18),
        takerAssetAmount: Pseudorandom.integer(0, 100e18),
        makerFee: Pseudorandom.integer(0, 100e18),
        takerFee: Pseudorandom.integer(0, 100e18),
        feeRecipientAddress: Pseudorandom.hex(constants.ADDRESS_LENGTH),
        makerAddress: Pseudorandom.hex(constants.ADDRESS_LENGTH),
        takerAddress: Pseudorandom.hex(constants.ADDRESS_LENGTH),
        senderAddress: Pseudorandom.hex(constants.ADDRESS_LENGTH),
        ...fields,
    };
}

function randomTransaction(
    fields: Partial<ZeroExTransaction> & { domain: EIP712DomainWithDefaultSchema },
): ZeroExTransaction {
    return {
        gasPrice: Pseudorandom.integer(1e9, 100e9),
        expirationTimeSeconds: Pseudorandom.integer(1, 2 ** 32),
        salt: Pseudorandom.integer(0, constants.MAX_UINT256),
        signerAddress: Pseudorandom.hex(constants.ADDRESS_LENGTH),
        data: Pseudorandom.hex(Pseudorandom.integer(4, 128).toNumber()),
        ...fields,
    };
}

function createSignature(params: {
    signatureType: SignatureType;
    hash?: string;
    signerKey?: Buffer;
    validator?: string;
    payload?: string;
}): string {
    const payload = params.payload || constants.NULL_BYTES;
    const signatureByte = hexUtils.leftPad(params.signatureType, 1);
    switch (params.signatureType) {
        default:
        case SignatureType.Illegal:
        case SignatureType.Invalid:
        case SignatureType.PreSigned:
            return hexUtils.concat(payload, signatureByte);
        case SignatureType.EIP712:
        case SignatureType.EthSign:
            return hexUtils.concat(
                payload,
                ethUtil.bufferToHex(
                    signingUtils.signMessage(ethUtil.toBuffer(params.hash), params.signerKey!, params.signatureType),
                ),
            );
        case SignatureType.Wallet:
        case SignatureType.EIP1271Wallet:
            return hexUtils.concat(payload, params.signatureType);
        case SignatureType.Validator:
            return hexUtils.concat(payload, params.validator!, params.signatureType);
    }
}

async function mangleSignatureParamsAsync(params: SignatureTestParams): Promise<SignatureTestParams> {
    const mangled = { ...params };
    const MANGLE_MODES = [
        'TRUNCATE_SIGNATURE',
        'RETYPE_SIGNATURE',
        'RANDOM_HASH',
        'RANDOM_ORDER',
        'RANDOM_TRANSACTION',
        'RANDOM_SIGNER',
    ];
    const invalidModes = [];
    if (!STRICT_LENGTH_SIGNATURE_TYPES.includes(mangled.signatureType)) {
        invalidModes.push('TRUNCATE_SIGNATURE');
    }
    if (CALLBACK_SIGNATURE_TYPES.includes(mangled.signatureType)) {
        invalidModes.push('RANDOM_HASH');
    }
    if (params.transaction === undefined) {
        invalidModes.push('RANDOM_TRANSACTION');
    }
    if (params.order === undefined) {
        invalidModes.push('RANDOM_ORDER');
    }
    if (params.order !== undefined || params.hash !== undefined) {
        invalidModes.push('RANDOM_HASH');
    }
    const mode = Pseudorandom.sample(_.without(MANGLE_MODES, ...invalidModes))!;
    switch (mode) {
        case 'TRUNCATE_SIGNATURE':
            while (hexUtils.slice(mangled.signature, -1) === hexUtils.leftPad(mangled.signatureType, 1)) {
                mangled.signature = hexUtils.slice(mangled.signature, 0, -1);
            }
            break;
        case 'RETYPE_SIGNATURE':
            mangled.signatureType = WALLET_SIGNATURE_TYPES.includes(mangled.signatureType)
                ? Pseudorandom.sample(_.without(ALL_SIGNATURE_TYPES, ...WALLET_SIGNATURE_TYPES))!
                : Pseudorandom.sample(_.without(ALL_SIGNATURE_TYPES, mangled.signatureType))!;
            mangled.signature = hexUtils.concat(hexUtils.slice(mangled.signature, 0, -1), mangled.signatureType);
            break;
        case 'RANDOM_SIGNER':
            mangled.signer = Pseudorandom.hex(constants.ADDRESS_LENGTH);
            if (mangled.order) {
                mangled.order.makerAddress = mangled.signer;
            }
            if (mangled.transaction) {
                mangled.transaction.signerAddress = mangled.signer;
            }
            break;
        case 'RANDOM_HASH':
            mangled.hash = Pseudorandom.hex();
            break;
        case 'RANDOM_ORDER':
            mangled.order = randomOrder({
                exchangeAddress: mangled.order!.exchangeAddress,
                chainId: mangled.order!.chainId,
            });
            mangled.hash = await orderHashUtils.getOrderHashAsync(mangled.order);
            break;
        case 'RANDOM_TRANSACTION':
            mangled.transaction = randomTransaction({
                domain: mangled.transaction!.domain,
            });
            mangled.hash = await transactionHashUtils.getTransactionHashHex(mangled.transaction);
            break;
        default:
            throw new Error(`Unhandled mangle mode: ${mode}`);
    }
    return mangled;
}

class HashSignatureValidatorActor extends SignatureValidatorActor {
    public constructor(config: SignatureValidatorActorConfig) {
        super(config);
        this.mixins.push('exchange/SignatureValidator/Hash');
        this.simulationActions = {
            ...this.simulationActions,
            validTestHashStaticSignature: this._validTestHashSignature(),
            invalidTestHashStaticSignature: this._invalidTestHashStaticSignature(),
            invalidTestHashWalletSignature: this._invalidTestHashWalletSignature(),
            invalidTestHashValidatorSignature: this._invalidTestHashValidatorSignature(),
            invalidTestHashMangledSignature: this._invalidTestHashMangledSignature(),
        };
    }

    private async *_validTestHashSignature(): AsyncIterableIterator<void> {
        while (true) {
            const { hash, signature, signatureType, signer } = this._createHashTestParams();
            yield (async () => {
                if (signatureType === SignatureType.PreSigned) {
                    await this._presignHashAsync(signer, hash);
                }
                await this._assertValidHashSignatureAsync({
                    hash,
                    signer,
                    signature,
                    isValid: true,
                });
            })();
        }
    }

    private async *_invalidTestHashStaticSignature(): AsyncIterableIterator<void> {
        while (true) {
            const randomSignerKey = ethUtil.toBuffer(Pseudorandom.hex());
            const signer = Pseudorandom.sample([
                this._notWalletContractAddress,
                this._walletContractAddress,
                ...Object.keys(this._accounts),
            ])!;
            const { hash, signature } = this._createHashTestParams({
                signatureType: Pseudorandom.sample([...STATIC_SIGNATURE_TYPES, ...ALWAYS_FAILING_SIGNATURE_TYPES])!,
                signer,
                // Always sign with a random key.
                signerKey: randomSignerKey,
            });
            yield this._assertValidHashSignatureAsync({
                hash,
                signer,
                signature,
                isValid: false,
            });
        }
    }

    private async *_invalidTestHashWalletSignature(): AsyncIterableIterator<void> {
        while (true) {
            const signer = Pseudorandom.sample([this._notWalletContractAddress, ...Object.keys(this._accounts)])!;
            const { hash, signature } = this._createHashTestParams({
                signatureType: SignatureType.Wallet,
                signer,
            });
            yield this._assertValidHashSignatureAsync({
                hash,
                signer,
                signature,
                isValid: false,
            });
        }
    }

    private async *_invalidTestHashValidatorSignature(): AsyncIterableIterator<void> {
        while (true) {
            const isNotApproved = Pseudorandom.sample([true, false])!;
            const signer = Pseudorandom.sample([...Object.keys(this._accounts)])!;
            const validator = isNotApproved
                ? this._walletContractAddress
                : Pseudorandom.sample([
                      // All validator signatures are invalid for the hash test, so passing a valid
                      // wallet contract should still fail.
                      this._walletContractAddress,
                      this._notWalletContractAddress,
                      ...Object.keys(this._accounts),
                  ])!;
            const { hash, signature } = this._createHashTestParams({
                signatureType: SignatureType.Validator,
                validator,
            });
            yield (async () => {
                if (!isNotApproved) {
                    await this._approveValidatorAsync(signer, validator);
                }
                await this._assertValidHashSignatureAsync({
                    hash,
                    signer,
                    signature,
                    isValid: false,
                });
            })();
        }
    }

    private async *_invalidTestHashMangledSignature(): AsyncIterableIterator<void> {
        while (true) {
            const params = this._createHashTestParams({ signatureType: Pseudorandom.sample(ALL_SIGNATURE_TYPES)! });
            const mangled = await mangleSignatureParamsAsync(params);
            yield (async () => {
                await this._assertValidHashSignatureAsync({
                    hash: mangled.hash,
                    signer: mangled.signer,
                    signature: mangled.signature,
                    isValid: false,
                });
            })();
        }
    }

    private _createHashTestParams(fields: Partial<SignatureTestParams> = {}): SignatureTestParams {
        const signatureType =
            fields.signatureType === undefined
                ? Pseudorandom.sample(HASH_COMPATIBLE_SIGNATURE_TYPES)!
                : fields.signatureType;
        const signer =
            fields.signer ||
            (WALLET_SIGNATURE_TYPES.includes(signatureType)
                ? this._walletContractAddress
                : Pseudorandom.sample(Object.keys(this._accounts))!);
        const validator =
            fields.validator || (signatureType === SignatureType.Validator ? this._walletContractAddress : undefined);
        const signerKey = fields.signerKey || this._accounts[signer];
        const hash = fields.hash || Pseudorandom.hex();
        const payload =
            fields.payload ||
            (STRICT_LENGTH_SIGNATURE_TYPES.includes(signatureType) ? constants.NULL_BYTES : randomPayload());
        const signature = createSignature({ signatureType, hash, signerKey, payload, validator });
        return {
            hash,
            payload,
            signature,
            signatureType,
            signer,
            signerKey,
            validator,
        };
    }

    private async _assertValidHashSignatureAsync(params: {
        hash: string;
        signer: string;
        signature: string;
        isValid: boolean;
    }): Promise<void> {
        try {
            let result;
            try {
                result = await this.deployment.exchange
                    .isValidHashSignature(params.hash, params.signer, params.signature)
                    .callAsync();
            } catch (err) {
                if (params.isValid) {
                    throw err;
                }
                return;
            }
            expect(result).to.eq(!!params.isValid);
        } catch (err) {
            logUtils.warn(params);
            throw err;
        }
    }
}

class OrderSignatureValidatorActor extends SignatureValidatorActor {
    public constructor(config: SignatureValidatorActorConfig) {
        super(config);
        this.mixins.push('exchange/SignatureValidator/Order');
        this.simulationActions = {
            ...this.simulationActions,
            validTestOrderSignature: this._validTestOrderSignature(),
            invalidTestOrderStaticSignature: this._invalidTestOrderStaticSignature(),
            invalidTestOrderWalletSignature: this._invalidTestOrderWalletSignature(),
            invalidTestOrderValidatorSignature: this._invalidTestOrderValidatorSignature(),
            invalidTestOrderMangledSignature: this._invalidTestOrderMangledSignature(),
        };
    }

    private async *_validTestOrderSignature(): AsyncIterableIterator<void> {
        while (true) {
            const {
                hash,
                order,
                signature,
                signatureType,
                signer,
                validator,
            } = await this._createOrderTestParamsAsync();
            yield (async () => {
                if (signatureType === SignatureType.PreSigned) {
                    await this._presignHashAsync(signer, hash);
                } else if (signatureType === SignatureType.Validator) {
                    await this._approveValidatorAsync(signer, validator!);
                }
                await this._assertValidOrderSignatureAsync({
                    order,
                    signature,
                    isValid: true,
                });
            })();
        }
    }

    private async *_invalidTestOrderStaticSignature(): AsyncIterableIterator<void> {
        while (true) {
            const randomSignerKey = ethUtil.toBuffer(Pseudorandom.hex());
            const signer = Pseudorandom.sample([
                this._notWalletContractAddress,
                this._walletContractAddress,
                ...Object.keys(this._accounts),
            ])!;
            const { order, signature } = await this._createOrderTestParamsAsync({
                signatureType: Pseudorandom.sample([...STATIC_SIGNATURE_TYPES, ...ALWAYS_FAILING_SIGNATURE_TYPES])!,
                signer,
                // Always sign with a random key.
                signerKey: randomSignerKey,
            });
            yield this._assertValidOrderSignatureAsync({
                order,
                signature,
                isValid: false,
            });
        }
    }

    private async *_invalidTestOrderWalletSignature(): AsyncIterableIterator<void> {
        while (true) {
            const signer = Pseudorandom.sample([this._notWalletContractAddress, ...Object.keys(this._accounts)])!;
            const { order, signature } = await this._createOrderTestParamsAsync({
                signatureType: Pseudorandom.sample(WALLET_SIGNATURE_TYPES)!,
                signer,
            });
            yield this._assertValidOrderSignatureAsync({
                order,
                signature,
                isValid: false,
            });
        }
    }

    private async *_invalidTestOrderValidatorSignature(): AsyncIterableIterator<void> {
        while (true) {
            const isNotApproved = Pseudorandom.sample([true, false])!;
            const signer = Pseudorandom.sample([...Object.keys(this._accounts)])!;
            const validator = isNotApproved
                ? this._walletContractAddress
                : Pseudorandom.sample([this._notWalletContractAddress, ...Object.keys(this._accounts)])!;
            const { order, signature } = await this._createOrderTestParamsAsync({
                signatureType: SignatureType.Validator,
                validator,
            });
            yield (async () => {
                if (!isNotApproved) {
                    await this._approveValidatorAsync(signer, validator);
                }
                await this._assertValidOrderSignatureAsync({
                    order,
                    signature,
                    isValid: false,
                });
            })();
        }
    }

    private async *_invalidTestOrderMangledSignature(): AsyncIterableIterator<void> {
        while (true) {
            const params = await this._createOrderTestParamsAsync({
                signatureType: Pseudorandom.sample(ALL_SIGNATURE_TYPES)!,
            });
            const mangled = await mangleSignatureParamsAsync(params);
            yield (async () => {
                await this._assertValidOrderSignatureAsync({
                    order: mangled.order!,
                    signature: mangled.signature,
                    isValid: false,
                });
            })();
        }
    }

    private async _createOrderTestParamsAsync(
        fields: Partial<SignatureTestParams> = {},
    ): Promise<SignatureTestParams & { order: Order }> {
        const signatureType =
            fields.signatureType === undefined
                ? Pseudorandom.sample(ALL_WORKING_SIGNATURE_TYPES)!
                : fields.signatureType;
        const signer =
            fields.signer ||
            (WALLET_SIGNATURE_TYPES.includes(signatureType)
                ? this._walletContractAddress
                : Pseudorandom.sample(Object.keys(this._accounts))!);
        const validator =
            fields.validator || (signatureType === SignatureType.Validator ? this._walletContractAddress : undefined);
        const signerKey = fields.signerKey || this._accounts[signer];
        const order = fields.order || (await this._randomOrderAsync({ makerAddress: signer }));
        const hash = fields.hash || (await orderHashUtils.getOrderHashAsync(order));
        const payload =
            fields.payload ||
            (STRICT_LENGTH_SIGNATURE_TYPES.includes(signatureType) ? constants.NULL_BYTES : randomPayload());
        const signature = createSignature({ signatureType, hash, signerKey, payload, validator });
        return {
            hash,
            order,
            payload,
            signature,
            signatureType,
            signer,
            signerKey,
            validator,
        };
    }

    private async _randomOrderAsync(fields: Partial<Order> = {}): Promise<Order> {
        return randomOrder({
            exchangeAddress: this.deployment.exchange.address,
            chainId: await this.deployment.web3Wrapper.getChainIdAsync(),
            ...fields,
        });
    }

    private async _assertValidOrderSignatureAsync(params: {
        order: Order;
        signature: string;
        isValid: boolean;
    }): Promise<void> {
        try {
            let result;
            try {
                result = await this.deployment.exchange
                    .isValidOrderSignature(params.order, params.signature)
                    .callAsync();
            } catch (err) {
                if (params.isValid) {
                    throw err;
                }
                return;
            }
            expect(result).to.eq(!!params.isValid);
        } catch (err) {
            logUtils.warn(params);
            throw err;
        }
    }
}

class TransactionSignatureValidatorActor extends SignatureValidatorActor {
    public constructor(config: SignatureValidatorActorConfig) {
        super(config);
        this.mixins.push('exchange/SignatureValidator/Transaction');
        this.simulationActions = {
            ...this.simulationActions,
            validTestTransactionSignature: this._validTestTransactionSignature(),
            invalidTestTransactionStaticSignature: this._invalidTestTransactionStaticSignature(),
            invalidTestTransactionWalletSignature: this._invalidTestTransactionWalletSignature(),
            invalidTestTransactionValidatorSignature: this._invalidTestTransactionValidatorSignature(),
            invalidTestTransactionMangledSignature: this._invalidTestTransactionMangledSignature(),
        };
    }

    private async *_validTestTransactionSignature(): AsyncIterableIterator<void> {
        while (true) {
            const {
                hash,
                transaction,
                signature,
                signatureType,
                signer,
                validator,
            } = await this._createTransactionTestParamsAsync();
            yield (async () => {
                if (signatureType === SignatureType.PreSigned) {
                    await this._presignHashAsync(signer, hash);
                } else if (signatureType === SignatureType.Validator) {
                    await this._approveValidatorAsync(signer, validator!);
                }
                await this._assertValidTransactionSignatureAsync({
                    transaction,
                    signature,
                    isValid: true,
                });
            })();
        }
    }

    private async *_invalidTestTransactionStaticSignature(): AsyncIterableIterator<void> {
        while (true) {
            const randomSignerKey = ethUtil.toBuffer(Pseudorandom.hex());
            const signer = Pseudorandom.sample([
                this._notWalletContractAddress,
                this._walletContractAddress,
                ...Object.keys(this._accounts),
            ])!;
            const { transaction, signature } = await this._createTransactionTestParamsAsync({
                signatureType: Pseudorandom.sample([...STATIC_SIGNATURE_TYPES, ...ALWAYS_FAILING_SIGNATURE_TYPES])!,
                signer,
                // Always sign with a random key.
                signerKey: randomSignerKey,
            });
            yield this._assertValidTransactionSignatureAsync({
                transaction,
                signature,
                isValid: false,
            });
        }
    }

    private async *_invalidTestTransactionWalletSignature(): AsyncIterableIterator<void> {
        while (true) {
            const signer = Pseudorandom.sample([this._notWalletContractAddress, ...Object.keys(this._accounts)])!;
            const { transaction, signature } = await this._createTransactionTestParamsAsync({
                signatureType: Pseudorandom.sample(WALLET_SIGNATURE_TYPES)!,
                signer,
            });
            yield this._assertValidTransactionSignatureAsync({
                transaction,
                signature,
                isValid: false,
            });
        }
    }

    private async *_invalidTestTransactionValidatorSignature(): AsyncIterableIterator<void> {
        while (true) {
            const isNotApproved = Pseudorandom.sample([true, false])!;
            const signer = Pseudorandom.sample([...Object.keys(this._accounts)])!;
            const validator = isNotApproved
                ? this._walletContractAddress
                : Pseudorandom.sample([this._notWalletContractAddress, ...Object.keys(this._accounts)])!;
            const { transaction, signature } = await this._createTransactionTestParamsAsync({
                signatureType: SignatureType.Validator,
                validator,
            });
            yield (async () => {
                if (!isNotApproved) {
                    await this._approveValidatorAsync(signer, validator);
                }
                await this._assertValidTransactionSignatureAsync({
                    transaction,
                    signature,
                    isValid: false,
                });
            })();
        }
    }

    private async *_invalidTestTransactionMangledSignature(): AsyncIterableIterator<void> {
        while (true) {
            const params = await this._createTransactionTestParamsAsync({
                signatureType: Pseudorandom.sample(ALL_SIGNATURE_TYPES)!,
            });
            const mangled = await mangleSignatureParamsAsync(params);
            yield (async () => {
                await this._assertValidTransactionSignatureAsync({
                    transaction: mangled.transaction!,
                    signature: mangled.signature,
                    isValid: false,
                });
            })();
        }
    }

    private async _createTransactionTestParamsAsync(
        fields: Partial<SignatureTestParams> = {},
    ): Promise<SignatureTestParams & { transaction: ZeroExTransaction }> {
        const signatureType =
            fields.signatureType === undefined
                ? Pseudorandom.sample(ALL_WORKING_SIGNATURE_TYPES)!
                : fields.signatureType;
        const signer =
            fields.signer ||
            (WALLET_SIGNATURE_TYPES.includes(signatureType)
                ? this._walletContractAddress
                : Pseudorandom.sample(Object.keys(this._accounts))!);
        const validator =
            fields.validator || (signatureType === SignatureType.Validator ? this._walletContractAddress : undefined);
        const signerKey = fields.signerKey || this._accounts[signer];
        const transaction = fields.transaction || (await this._randomTransactionAsync({ signerAddress: signer }));
        const hash = fields.hash || transactionHashUtils.getTransactionHashHex(transaction);
        const payload =
            fields.payload ||
            (STRICT_LENGTH_SIGNATURE_TYPES.includes(signatureType) ? constants.NULL_BYTES : randomPayload());
        const signature = createSignature({ signatureType, hash, signerKey, payload, validator });
        return {
            hash,
            transaction,
            payload,
            signature,
            signatureType,
            signer,
            signerKey,
            validator,
        };
    }

    private async _randomTransactionAsync(fields: Partial<ZeroExTransaction> = {}): Promise<ZeroExTransaction> {
        return randomTransaction({
            domain: {
                chainId: await this.deployment.web3Wrapper.getChainIdAsync(),
                verifyingContract: this.deployment.exchange.address,
                name: '0x Protocol',
                version: '3.0.0',
            },
            ...fields,
        });
    }

    private async _assertValidTransactionSignatureAsync(params: {
        transaction: ZeroExTransaction;
        signature: string;
        isValid: boolean;
    }): Promise<void> {
        try {
            let result;
            try {
                result = await this.deployment.exchange
                    .isValidTransactionSignature(params.transaction, params.signature)
                    .callAsync();
            } catch (err) {
                if (params.isValid) {
                    throw err;
                }
                return;
            }
            expect(result).to.eq(!!params.isValid);
        } catch (err) {
            logUtils.warn(params);
            throw err;
        }
    }
}

export class SignatureValidationSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { actors } = this.environment;
        const actions = _.flatten(actors.map(a => Object.values(a.simulationActions)));
        while (true) {
            const action = Pseudorandom.sample(actions)!;
            yield (await action!.next()).value;
        }
    }
}

const tests = process.env.FUZZ_TEST === 'exchange/signature_validation' ? blockchainTests : blockchainTests.skip;

tests('Exchange signature validation fuzz tests', env => {
    let walletContract: TestSignatureValidationWalletContract;

    before(async () => {
        walletContract = await TestSignatureValidationWalletContract.deployFrom0xArtifactAsync(
            artifacts.TestSignatureValidationWallet,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    after(async () => {
        Actor.reset();
    });

    it('fuzz', async () => {
        const deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 0,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const balanceStore = new BlockchainBalanceStore({}, {});
        const actorConfig = {
            deployment,
            walletContractAddress: walletContract.address,
            // This just has to be a contract address that doesn't implement the
            // wallet spec.
            notWalletContractAddress: deployment.exchange.address,
        };

        const simulationEnvironment = new SimulationEnvironment(deployment, balanceStore, [
            new HashSignatureValidatorActor(actorConfig),
            new OrderSignatureValidatorActor(actorConfig),
            new TransactionSignatureValidatorActor(actorConfig),
        ]);

        const simulation = new SignatureValidationSimulation(simulationEnvironment);
        simulation.resets = true;
        return simulation.fuzzAsync();
    });
});
// tslint:disable-next-line max-file-line-count
