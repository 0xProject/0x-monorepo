import { ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { Artifacts } from '../util/artifacts';
import { constants } from '../util/constants';
import { TokenRegWrapper } from '../util/token_registry_wrapper';
import { ContractInstance } from '../util/types';

import { chaiSetup } from './utils/chai_setup';

const { TokenRegistry } = new Artifacts(artifacts);
chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();
const blockchainLifecycle = new BlockchainLifecycle(devConstants.RPC_URL);

describe('TokenRegistry', () => {
    const web3Wrapper = new Web3Wrapper(web3.currentProvider);
    let owner: string;
    let notOwner: string;
    let tokenReg: ContractInstance;
    let tokenRegWrapper: TokenRegWrapper;
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        notOwner = accounts[1];
        tokenReg = await TokenRegistry.new();
        tokenRegWrapper = new TokenRegWrapper(tokenReg);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    const tokenAddress1 = `0x${ethUtil.setLength(ethUtil.toBuffer('0x1'), 20, false).toString('hex')}`;
    const tokenAddress2 = `0x${ethUtil.setLength(ethUtil.toBuffer('0x2'), 20, false).toString('hex')}`;

    const token1 = {
        address: tokenAddress1,
        name: 'testToken1',
        symbol: 'TT1',
        decimals: 18,
        ipfsHash: `0x${ethUtil.sha3('ipfs1').toString('hex')}`,
        swarmHash: `0x${ethUtil.sha3('swarm1').toString('hex')}`,
    };

    const token2 = {
        address: tokenAddress2,
        name: 'testToken2',
        symbol: 'TT2',
        decimals: 18,
        ipfsHash: `0x${ethUtil.sha3('ipfs2').toString('hex')}`,
        swarmHash: `0x${ethUtil.sha3('swarm2').toString('hex')}`,
    };

    const nullToken = {
        address: ZeroEx.NULL_ADDRESS,
        name: '',
        symbol: '',
        decimals: 0,
        ipfsHash: constants.NULL_BYTES,
        swarmHash: constants.NULL_BYTES,
    };

    describe('addToken', () => {
        it('should throw when not called by owner', async () => {
            return expect(tokenRegWrapper.addTokenAsync(token1, notOwner)).to.be.rejectedWith(constants.REVERT);
        });

        it('should add token metadata when called by owner', async () => {
            await tokenRegWrapper.addTokenAsync(token1, owner);
            const tokenData = await tokenRegWrapper.getTokenMetaDataAsync(token1.address);
            expect(tokenData).to.be.deep.equal(token1);
        });

        it('should throw if token already exists', async () => {
            await tokenRegWrapper.addTokenAsync(token1, owner);

            return expect(tokenRegWrapper.addTokenAsync(token1, owner)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if token address is null', async () => {
            return expect(tokenRegWrapper.addTokenAsync(nullToken, owner)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if name already exists', async () => {
            await tokenRegWrapper.addTokenAsync(token1, owner);
            const duplicateNameToken = _.assign({}, token2, { name: token1.name });

            return expect(tokenRegWrapper.addTokenAsync(duplicateNameToken, owner)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if symbol already exists', async () => {
            await tokenRegWrapper.addTokenAsync(token1, owner);
            const duplicateSymbolToken = _.assign({}, token2, {
                symbol: token1.symbol,
            });

            return expect(tokenRegWrapper.addTokenAsync(duplicateSymbolToken, owner)).to.be.rejectedWith(
                constants.REVERT,
            );
        });
    });

    describe('after addToken', () => {
        beforeEach(async () => {
            await tokenRegWrapper.addTokenAsync(token1, owner);
        });

        describe('getTokenByName', () => {
            it('should return token metadata when given the token name', async () => {
                const tokenData = await tokenRegWrapper.getTokenByNameAsync(token1.name);
                expect(tokenData).to.be.deep.equal(token1);
            });
        });

        describe('getTokenBySymbol', () => {
            it('should return token metadata when given the token symbol', async () => {
                const tokenData = await tokenRegWrapper.getTokenBySymbolAsync(token1.symbol);
                expect(tokenData).to.be.deep.equal(token1);
            });
        });

        describe('setTokenName', () => {
            it('should throw when not called by owner', async () => {
                return expect(
                    tokenReg.setTokenName(token1.address, token2.name, { from: notOwner }),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should change the token name when called by owner', async () => {
                const res = await tokenReg.setTokenName(token1.address, token2.name, {
                    from: owner,
                });
                expect(res.logs).to.have.length(1);
                const [newData, oldData] = await Promise.all([
                    tokenRegWrapper.getTokenByNameAsync(token2.name),
                    tokenRegWrapper.getTokenByNameAsync(token1.name),
                ]);

                const expectedNewData = _.assign({}, token1, { name: token2.name });
                const expectedOldData = nullToken;
                expect(newData).to.be.deep.equal(expectedNewData);
                expect(oldData).to.be.deep.equal(expectedOldData);
            });

            it('should throw if the name already exists', async () => {
                await tokenRegWrapper.addTokenAsync(token2, owner);

                return expect(tokenReg.setTokenName(token1.address, token2.name, { from: owner })).to.be.rejectedWith(
                    constants.REVERT,
                );
            });

            it('should throw if token does not exist', async () => {
                return expect(
                    tokenReg.setTokenName(nullToken.address, token2.name, { from: owner }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('setTokenSymbol', () => {
            it('should throw when not called by owner', async () => {
                return expect(
                    tokenReg.setTokenSymbol(token1.address, token2.symbol, {
                        from: notOwner,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should change the token symbol when called by owner', async () => {
                const res = await tokenReg.setTokenSymbol(token1.address, token2.symbol, { from: owner });
                expect(res.logs).to.have.length(1);
                const [newData, oldData] = await Promise.all([
                    tokenRegWrapper.getTokenBySymbolAsync(token2.symbol),
                    tokenRegWrapper.getTokenBySymbolAsync(token1.symbol),
                ]);

                const expectedNewData = _.assign({}, token1, { symbol: token2.symbol });
                const expectedOldData = nullToken;
                expect(newData).to.be.deep.equal(expectedNewData);
                expect(oldData).to.be.deep.equal(expectedOldData);
            });

            it('should throw if the symbol already exists', async () => {
                await tokenRegWrapper.addTokenAsync(token2, owner);

                return expect(
                    tokenReg.setTokenSymbol(token1.address, token2.symbol, {
                        from: owner,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should throw if token does not exist', async () => {
                return expect(
                    tokenReg.setTokenSymbol(nullToken.address, token2.symbol, {
                        from: owner,
                    }),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('removeToken', () => {
            it('should throw if not called by owner', async () => {
                const index = 0;
                return expect(tokenReg.removeToken(token1.address, index, { from: notOwner })).to.be.rejectedWith(
                    constants.REVERT,
                );
            });

            it('should remove token metadata when called by owner', async () => {
                const index = 0;
                const res = await tokenReg.removeToken(token1.address, index, {
                    from: owner,
                });
                expect(res.logs).to.have.length(1);
                const tokenData = await tokenRegWrapper.getTokenMetaDataAsync(token1.address);
                expect(tokenData).to.be.deep.equal(nullToken);
            });

            it('should throw if token does not exist', async () => {
                const index = 0;
                return expect(tokenReg.removeToken(nullToken.address, index, { from: owner })).to.be.rejectedWith(
                    constants.REVERT,
                );
            });

            it('should throw if token at given index does not match address', async () => {
                await tokenRegWrapper.addTokenAsync(token2, owner);
                const incorrectIndex = 0;
                return expect(tokenReg.removeToken(token2.address, incorrectIndex, { from: owner })).to.be.rejectedWith(
                    constants.REVERT,
                );
            });
        });
    });
});
