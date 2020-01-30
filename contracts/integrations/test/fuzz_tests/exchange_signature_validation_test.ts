import { ExchangeContract } from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    expect,
    orderHashUtils,
    signingUtils,
    transactionHashUtils,
} from '@0x/contracts-test-utils';
import { Order, SignatureType, ZeroExTransaction } from '@0x/types';
import { hexUtils, logUtils } from '@0x/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';
import { TestSignatureValidationWalletContract } from '../wrappers';

// tslint:disable: max-classes-per-file no-non-null-assertion no-unnecessary-type-assertion
const tests = process.env.FUZZ_TEST === 'exchange/signature_validation' ? blockchainTests : blockchainTests.skip;

tests('Exchange signature validation fuzz tests', env => {
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

    let walletContractAddress: string;
    let notWalletContractAddress: string;
    let deployment: DeploymentManager;
    let exchange: ExchangeContract;
    let accounts: string[];
    let privateKeys: { [address: string]: Buffer };
    let chainId: number;

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

    before(async () => {
        chainId = await env.web3Wrapper.getChainIdAsync();
        accounts = await env.getAccountAddressesAsync();
        privateKeys = _.zipObject(accounts, accounts.map((a, i) => constants.TESTRPC_PRIVATE_KEYS[i]));
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 0,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        exchange = deployment.exchange;
        walletContractAddress = (await TestSignatureValidationWalletContract.deployFrom0xArtifactAsync(
            artifacts.TestSignatureValidationWallet,
            env.provider,
            env.txDefaults,
            {},
        )).address;
        // This just has to be a contract address that doesn't implement the
        // wallet spec.
        notWalletContractAddress = exchange.address;
    });

    function randomPayload(): string {
        return Pseudorandom.hex(Pseudorandom.integer(0, 66).toNumber());
    }

    async function presignHashAsync(signer: string, hash: string): Promise<void> {
        await exchange.preSign(hash).awaitTransactionSuccessAsync({ from: signer });
    }

    async function approveValidatorAsync(signer: string, validator: string, approved: boolean = true): Promise<void> {
        await exchange
            .setSignatureValidatorApproval(validator, approved)
            .awaitTransactionSuccessAsync({ from: signer });
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
                        signingUtils.signMessage(
                            ethUtil.toBuffer(params.hash),
                            params.signerKey!,
                            params.signatureType,
                        ),
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
                mangled.hash = await orderHashUtils.getOrderHashHex(mangled.order);
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

    function createHashTestParams(fields: Partial<SignatureTestParams> = {}): SignatureTestParams {
        const signatureType =
            fields.signatureType === undefined
                ? Pseudorandom.sample(HASH_COMPATIBLE_SIGNATURE_TYPES)!
                : fields.signatureType;
        const signer =
            fields.signer ||
            (WALLET_SIGNATURE_TYPES.includes(signatureType) ? walletContractAddress : Pseudorandom.sample(accounts)!);
        const validator =
            fields.validator || (signatureType === SignatureType.Validator ? walletContractAddress : undefined);
        const signerKey = fields.signerKey || privateKeys[signer];
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

    async function assertValidHashSignatureAsync(params: {
        hash: string;
        signer: string;
        signature: string;
        isValid: boolean;
    }): Promise<void> {
        try {
            let result;
            try {
                result = await exchange.isValidHashSignature(params.hash, params.signer, params.signature).callAsync();
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

    async function* validTestHashSignature(): AsyncIterableIterator<void> {
        while (true) {
            const { hash, signature, signatureType, signer } = createHashTestParams();
            yield (async () => {
                if (signatureType === SignatureType.PreSigned) {
                    await presignHashAsync(signer, hash);
                }
                await assertValidHashSignatureAsync({
                    hash,
                    signer,
                    signature,
                    isValid: true,
                });
            })();
        }
    }

    async function* invalidTestHashStaticSignature(): AsyncIterableIterator<void> {
        while (true) {
            const randomSignerKey = ethUtil.toBuffer(Pseudorandom.hex());
            const signer = Pseudorandom.sample([notWalletContractAddress, walletContractAddress, ...accounts])!;
            const { hash, signature } = createHashTestParams({
                signatureType: Pseudorandom.sample([...STATIC_SIGNATURE_TYPES, ...ALWAYS_FAILING_SIGNATURE_TYPES])!,
                signer,
                // Always sign with a random key.
                signerKey: randomSignerKey,
            });
            yield assertValidHashSignatureAsync({
                hash,
                signer,
                signature,
                isValid: false,
            });
        }
    }

    async function* invalidTestHashWalletSignature(): AsyncIterableIterator<void> {
        while (true) {
            const signer = Pseudorandom.sample([notWalletContractAddress, ...accounts])!;
            const { hash, signature } = createHashTestParams({
                signatureType: SignatureType.Wallet,
                signer,
            });
            yield assertValidHashSignatureAsync({
                hash,
                signer,
                signature,
                isValid: false,
            });
        }
    }

    async function* invalidTestHashValidatorSignature(): AsyncIterableIterator<void> {
        while (true) {
            const isNotApproved = Pseudorandom.sample([true, false])!;
            const signer = Pseudorandom.sample([...accounts])!;
            const validator = isNotApproved
                ? walletContractAddress
                : Pseudorandom.sample([
                      // All validator signatures are invalid for the hash test, so passing a valid
                      // wallet contract should still fail.
                      walletContractAddress,
                      notWalletContractAddress,
                      ...accounts,
                  ])!;
            const { hash, signature } = createHashTestParams({
                signatureType: SignatureType.Validator,
                validator,
            });
            yield (async () => {
                if (!isNotApproved) {
                    await approveValidatorAsync(signer, validator);
                }
                await assertValidHashSignatureAsync({
                    hash,
                    signer,
                    signature,
                    isValid: false,
                });
            })();
        }
    }

    async function* invalidTestHashMangledSignature(): AsyncIterableIterator<void> {
        while (true) {
            const params = createHashTestParams({ signatureType: Pseudorandom.sample(ALL_SIGNATURE_TYPES)! });
            const mangled = await mangleSignatureParamsAsync(params);
            yield (async () => {
                await assertValidHashSignatureAsync({
                    hash: mangled.hash,
                    signer: mangled.signer,
                    signature: mangled.signature,
                    isValid: false,
                });
            })();
        }
    }

    function randomOrder(fields: Partial<Order> = {}): Order {
        return {
            chainId,
            exchangeAddress: exchange.address,
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

    async function createOrderTestParamsAsync(
        fields: Partial<SignatureTestParams> = {},
    ): Promise<SignatureTestParams & { order: Order }> {
        const signatureType =
            fields.signatureType === undefined
                ? Pseudorandom.sample(ALL_WORKING_SIGNATURE_TYPES)!
                : fields.signatureType;
        const signer =
            fields.signer ||
            (WALLET_SIGNATURE_TYPES.includes(signatureType) ? walletContractAddress : Pseudorandom.sample(accounts)!);
        const validator =
            fields.validator || (signatureType === SignatureType.Validator ? walletContractAddress : undefined);
        const signerKey = fields.signerKey || privateKeys[signer];
        const order = fields.order || randomOrder({ makerAddress: signer });
        const hash = fields.hash || (await orderHashUtils.getOrderHashHex(order));
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

    async function assertValidOrderSignatureAsync(params: {
        order: Order;
        signature: string;
        isValid: boolean;
    }): Promise<void> {
        try {
            let result;
            try {
                result = await exchange.isValidOrderSignature(params.order, params.signature).callAsync();
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

    async function* validTestOrderSignature(): AsyncIterableIterator<void> {
        while (true) {
            const { hash, order, signature, signatureType, signer, validator } = await createOrderTestParamsAsync();
            yield (async () => {
                if (signatureType === SignatureType.PreSigned) {
                    await presignHashAsync(signer, hash);
                } else if (signatureType === SignatureType.Validator) {
                    await approveValidatorAsync(signer, validator!);
                }
                await assertValidOrderSignatureAsync({
                    order,
                    signature,
                    isValid: true,
                });
            })();
        }
    }

    async function* invalidTestOrderStaticSignature(): AsyncIterableIterator<void> {
        while (true) {
            const randomSignerKey = ethUtil.toBuffer(Pseudorandom.hex());
            const signer = Pseudorandom.sample([notWalletContractAddress, walletContractAddress, ...accounts])!;
            const { order, signature } = await createOrderTestParamsAsync({
                signatureType: Pseudorandom.sample([...STATIC_SIGNATURE_TYPES, ...ALWAYS_FAILING_SIGNATURE_TYPES])!,
                signer,
                // Always sign with a random key.
                signerKey: randomSignerKey,
            });
            yield assertValidOrderSignatureAsync({
                order,
                signature,
                isValid: false,
            });
        }
    }

    async function* invalidTestOrderWalletSignature(): AsyncIterableIterator<void> {
        while (true) {
            const signer = Pseudorandom.sample([notWalletContractAddress, ...accounts])!;
            const { order, signature } = await createOrderTestParamsAsync({
                signatureType: Pseudorandom.sample(WALLET_SIGNATURE_TYPES)!,
                signer,
            });
            yield assertValidOrderSignatureAsync({
                order,
                signature,
                isValid: false,
            });
        }
    }

    async function* invalidTestOrderValidatorSignature(): AsyncIterableIterator<void> {
        while (true) {
            const isNotApproved = Pseudorandom.sample([true, false])!;
            const signer = Pseudorandom.sample([...accounts])!;
            const validator = isNotApproved
                ? walletContractAddress
                : Pseudorandom.sample([notWalletContractAddress, ...accounts])!;
            const { order, signature } = await createOrderTestParamsAsync({
                signatureType: SignatureType.Validator,
                validator,
            });
            yield (async () => {
                if (!isNotApproved) {
                    await approveValidatorAsync(signer, validator);
                }
                await assertValidOrderSignatureAsync({
                    order,
                    signature,
                    isValid: false,
                });
            })();
        }
    }

    async function* invalidTestOrderMangledSignature(): AsyncIterableIterator<void> {
        while (true) {
            const params = await createOrderTestParamsAsync({
                signatureType: Pseudorandom.sample(ALL_SIGNATURE_TYPES)!,
            });
            const mangled = await mangleSignatureParamsAsync(params);
            yield (async () => {
                await assertValidOrderSignatureAsync({
                    order: mangled.order!,
                    signature: mangled.signature,
                    isValid: false,
                });
            })();
        }
    }

    function randomTransaction(fields: Partial<ZeroExTransaction> = {}): ZeroExTransaction {
        return {
            domain: {
                chainId,
                verifyingContract: exchange.address,
                name: '0x Protocol',
                version: '3.0.0',
            },
            gasPrice: Pseudorandom.integer(1e9, 100e9),
            expirationTimeSeconds: Pseudorandom.integer(1, 2 ** 32),
            salt: Pseudorandom.integer(0, constants.MAX_UINT256),
            signerAddress: Pseudorandom.hex(constants.ADDRESS_LENGTH),
            data: Pseudorandom.hex(Pseudorandom.integer(4, 128).toNumber()),
            ...fields,
        };
    }

    async function createTransactionTestParamsAsync(
        fields: Partial<SignatureTestParams> = {},
    ): Promise<SignatureTestParams & { transaction: ZeroExTransaction }> {
        const signatureType =
            fields.signatureType === undefined
                ? Pseudorandom.sample(ALL_WORKING_SIGNATURE_TYPES)!
                : fields.signatureType;
        const signer =
            fields.signer ||
            (WALLET_SIGNATURE_TYPES.includes(signatureType) ? walletContractAddress : Pseudorandom.sample(accounts)!);
        const validator =
            fields.validator || (signatureType === SignatureType.Validator ? walletContractAddress : undefined);
        const signerKey = fields.signerKey || privateKeys[signer];
        const transaction = fields.transaction || randomTransaction({ signerAddress: signer });
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

    async function assertValidTransactionSignatureAsync(params: {
        transaction: ZeroExTransaction;
        signature: string;
        isValid: boolean;
    }): Promise<void> {
        try {
            let result;
            try {
                result = await exchange.isValidTransactionSignature(params.transaction, params.signature).callAsync();
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

    async function* validTestTransactionSignature(): AsyncIterableIterator<void> {
        while (true) {
            const {
                hash,
                transaction,
                signature,
                signatureType,
                signer,
                validator,
            } = await createTransactionTestParamsAsync();
            yield (async () => {
                if (signatureType === SignatureType.PreSigned) {
                    await presignHashAsync(signer, hash);
                } else if (signatureType === SignatureType.Validator) {
                    await approveValidatorAsync(signer, validator!);
                }
                await assertValidTransactionSignatureAsync({
                    transaction,
                    signature,
                    isValid: true,
                });
            })();
        }
    }

    async function* invalidTestTransactionStaticSignature(): AsyncIterableIterator<void> {
        while (true) {
            const randomSignerKey = ethUtil.toBuffer(Pseudorandom.hex());
            const signer = Pseudorandom.sample([notWalletContractAddress, walletContractAddress, ...accounts])!;
            const { transaction, signature } = await createTransactionTestParamsAsync({
                signatureType: Pseudorandom.sample([...STATIC_SIGNATURE_TYPES, ...ALWAYS_FAILING_SIGNATURE_TYPES])!,
                signer,
                // Always sign with a random key.
                signerKey: randomSignerKey,
            });
            yield assertValidTransactionSignatureAsync({
                transaction,
                signature,
                isValid: false,
            });
        }
    }

    async function* invalidTestTransactionWalletSignature(): AsyncIterableIterator<void> {
        while (true) {
            const signer = Pseudorandom.sample([notWalletContractAddress, ...accounts])!;
            const { transaction, signature } = await createTransactionTestParamsAsync({
                signatureType: Pseudorandom.sample(WALLET_SIGNATURE_TYPES)!,
                signer,
            });
            yield assertValidTransactionSignatureAsync({
                transaction,
                signature,
                isValid: false,
            });
        }
    }

    async function* invalidTestTransactionValidatorSignature(): AsyncIterableIterator<void> {
        while (true) {
            const isNotApproved = Pseudorandom.sample([true, false])!;
            const signer = Pseudorandom.sample([...accounts])!;
            const validator = isNotApproved
                ? walletContractAddress
                : Pseudorandom.sample([notWalletContractAddress, ...accounts])!;
            const { transaction, signature } = await createTransactionTestParamsAsync({
                signatureType: SignatureType.Validator,
                validator,
            });
            yield (async () => {
                if (!isNotApproved) {
                    await approveValidatorAsync(signer, validator);
                }
                await assertValidTransactionSignatureAsync({
                    transaction,
                    signature,
                    isValid: false,
                });
            })();
        }
    }

    async function* invalidTestTransactionMangledSignature(): AsyncIterableIterator<void> {
        while (true) {
            const params = await createTransactionTestParamsAsync({
                signatureType: Pseudorandom.sample(ALL_SIGNATURE_TYPES)!,
            });
            const mangled = await mangleSignatureParamsAsync(params);
            yield (async () => {
                await assertValidTransactionSignatureAsync({
                    transaction: mangled.transaction!,
                    signature: mangled.signature,
                    isValid: false,
                });
            })();
        }
    }

    it('fuzz', async () => {
        const FUZZ_ACTIONS = [
            validTestHashSignature(),
            invalidTestHashStaticSignature(),
            invalidTestHashWalletSignature(),
            invalidTestHashValidatorSignature(),
            invalidTestHashMangledSignature(),
            validTestOrderSignature(),
            invalidTestOrderStaticSignature(),
            invalidTestOrderWalletSignature(),
            invalidTestOrderValidatorSignature(),
            invalidTestOrderMangledSignature(),
            validTestTransactionSignature(),
            invalidTestTransactionStaticSignature(),
            invalidTestTransactionWalletSignature(),
            invalidTestTransactionValidatorSignature(),
            invalidTestTransactionMangledSignature(),
        ];
        const simulationEnvironment = new SimulationEnvironment(deployment, new BlockchainBalanceStore({}, {}), []);
        const simulation = new class extends Simulation {
            // tslint:disable-next-line: prefer-function-over-method
            protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
                while (true) {
                    const action = Pseudorandom.sample(FUZZ_ACTIONS)!;
                    yield (await action!.next()).value;
                }
            }
        }(simulationEnvironment);
        simulation.resets = true;
        return simulation.fuzzAsync();
    });
});
// tslint:disable-next-line max-file-line-count
