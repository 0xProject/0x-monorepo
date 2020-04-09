import { BaseContract } from '@0x/base-contract';
import { blockchainTests, constants, expect, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, hexUtils, ZeroExRevertErrors } from '@0x/utils';
import { DataItem, MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { abis } from './utils/abis';
import { fullMigrateAsync } from './utils/migration';
import {
    IOwnableContract,
    IPuppetPoolContract,
    ITokenSpenderContract,
    ITransformERC20Contract,
    PuppetContract,
    ZeroExContract,
} from './wrappers';

const { NULL_ADDRESS } = constants;

blockchainTests.resets('Full migration', env => {
    let owner: string;
    let zeroEx: ZeroExContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults);
    });

    it('ZeroEx has the correct owner', async () => {
        const ownable = new IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
        const actualOwner = await ownable.owner().callAsync();
        expect(actualOwner).to.eq(owner);
    });

    const FEATURE_FNS = {
        TokenSpender: {
            contractType: ITokenSpenderContract,
            fns: ['_spendERC20Tokens'],
        },
        PuppetPool: {
            contractType: IPuppetPoolContract,
            fns: ['getFreePuppetsCount', 'isPuppet', '_acquirePuppet', '_releasePuppet'],
        },
        TransformERC20: {
            contractType: ITransformERC20Contract,
            fns: ['transformERC20', '_transformERC20'],
        },
    };

    function createFakeInputs(inputs: DataItem[] | DataItem): any | any[] {
        if ((inputs as DataItem[]).length !== undefined) {
            return (inputs as DataItem[]).map(i => createFakeInputs(i));
        }
        const item = inputs as DataItem;
        // TODO(dorothy-zbornak): Support fixed-length arrays.
        if (/\[]$/.test(item.type)) {
            return _.times(_.random(0, 8), () =>
                createFakeInputs({
                    ...item,
                    type: item.type.substring(0, item.type.length - 2),
                }),
            );
        }
        if (/^tuple$/.test(item.type)) {
            const tuple = {} as any;
            for (const comp of item.components as DataItem[]) {
                tuple[comp.name] = createFakeInputs(comp);
            }
            return tuple;
        }
        if (item.type === 'address') {
            return randomAddress();
        }
        if (item.type === 'byte') {
            return hexUtils.random(1);
        }
        if (/^bytes$/.test(item.type)) {
            return hexUtils.random(_.random(0, 128));
        }
        if (/^bytes\d+$/.test(item.type)) {
            return hexUtils.random(parseInt(/\d+$/.exec(item.type)![0], 10));
        }
        if (/^uint\d+$/.test(item.type)) {
            return new BigNumber(hexUtils.random(parseInt(/\d+$/.exec(item.type)![0], 10) / 8));
        }
        if (/^int\d+$/.test(item.type)) {
            return new BigNumber(hexUtils.random(parseInt(/\d+$/.exec(item.type)![0], 10) / 8))
                .div(2)
                .times(_.sample([-1, 1])!);
        }
        throw new Error(`Unhandled input type: '${item.type}'`);
    }

    for (const [featureName, featureInfo] of Object.entries(FEATURE_FNS)) {
        describe(`${featureName} feature`, () => {
            let contract: BaseContract & { getSelector(name: string): string };

            before(async () => {
                contract = new featureInfo.contractType(zeroEx.address, env.provider, env.txDefaults, abis);
            });

            for (const fn of featureInfo.fns) {
                it(`${fn} is registered`, async () => {
                    const selector = contract.getSelector(fn);
                    const impl = await zeroEx.getFunctionImplementation(selector).callAsync();
                    expect(impl).to.not.eq(NULL_ADDRESS);
                });

                if (fn.startsWith('_')) {
                    it(`${fn} cannot be called from outside`, async () => {
                        const method = contract.abi.find(
                            d => d.type === 'function' && (d as MethodAbi).name === fn,
                        ) as MethodAbi;
                        const inputs = createFakeInputs(method.inputs);
                        const tx = (contract as any)[fn](...inputs).callAsync();
                        return expect(tx).to.revertWith(
                            new ZeroExRevertErrors.Common.OnlyCallableBySelfError(env.txDefaults.from),
                        );
                    });
                }
            }
        });
    }

    describe("TokenSpender's puppet", () => {
        let puppet: PuppetContract;

        before(async () => {
            const contract = new ITokenSpenderContract(zeroEx.address, env.provider, env.txDefaults);
            puppet = new PuppetContract(
                await contract.getTokenSpenderPuppet().callAsync(),
                env.provider,
                env.txDefaults,
            );
        });

        it('is owned by owner', async () => {
            return expect(puppet.owner().callAsync()).to.become(owner);
        });

        it('Proxy is authorized', async () => {
            return expect(puppet.authorized(zeroEx.address).callAsync()).to.become(true);
        });
    });
});
