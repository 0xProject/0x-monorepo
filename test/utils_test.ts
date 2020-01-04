import { tokenUtils } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber, NULL_ADDRESS, NULL_BYTES } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { utils } from '../src/utils/utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('utils', () => {
    describe('isAssetDataEquivalent', () => {
        describe('ERC20', () => {
            const [tokenA, tokenB] = tokenUtils.getDummyERC20TokenAddresses();
            it('should succeed ERC20 to be ERC20Bridge', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC20AssetData(tokenA),
                    assetDataUtils.encodeERC20BridgeAssetData(tokenA, NULL_ADDRESS, NULL_BYTES),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should succeed ERC20Bridge to be ERC20', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC20BridgeAssetData(tokenA, NULL_ADDRESS, NULL_BYTES),
                    assetDataUtils.encodeERC20AssetData(tokenA),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should succeed ERC20 to be ERC20', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC20AssetData(tokenA),
                    assetDataUtils.encodeERC20AssetData(tokenA),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should fail if ERC20Bridge is not the same ERC20 token', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC20AssetData(tokenA),
                    assetDataUtils.encodeERC20BridgeAssetData(tokenB, NULL_ADDRESS, NULL_BYTES),
                );
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC20 is not the same ERC20 token', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC20AssetData(tokenA),
                    assetDataUtils.encodeERC20AssetData(tokenB),
                );
                expect(isEquivalent).to.be.false();
            });
        });
        describe('ERC721', () => {
            const [tokenA, tokenB] = tokenUtils.getDummyERC20TokenAddresses();
            const tokenIdA = new BigNumber(1);
            const tokenIdB = new BigNumber(2);
            it('should succeed if ERC721 the same ERC721 token and id', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA),
                    assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should fail if ERC721 is not the same ERC721 token', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA),
                    assetDataUtils.encodeERC721AssetData(tokenB, tokenIdA),
                );
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC721 is not the same ERC721 id', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA),
                    assetDataUtils.encodeERC721AssetData(tokenA, tokenIdB),
                );
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC721 is compared with ERC20', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC721AssetData(tokenA, tokenIdA),
                    assetDataUtils.encodeERC20AssetData(tokenA),
                );
                expect(isEquivalent).to.be.false();
            });
        });
        describe('ERC1155', () => {
            const [tokenA, tokenB] = tokenUtils.getDummyERC20TokenAddresses();
            const tokenIdA = new BigNumber(1);
            const tokenIdB = new BigNumber(2);
            const valueA = new BigNumber(1);
            const valueB = new BigNumber(2);
            it('should succeed if ERC1155 is the same ERC1155 token and id', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA], [valueA], NULL_BYTES),
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA], [valueA], NULL_BYTES),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should succeed if ERC1155 is the same ERC1155 token and ids', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], NULL_BYTES),
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], NULL_BYTES),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should succeed if ERC1155 is the same ERC1155 token and ids in different orders', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], NULL_BYTES),
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], NULL_BYTES),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should succeed if ERC1155 is the same ERC1155 token and ids with different callback data', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], NULL_BYTES),
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], tokenA),
                );
                expect(isEquivalent).to.be.true();
            });
            it('should fail if ERC1155 contains different ids', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], NULL_BYTES),
                    assetDataUtils.encodeERC1155AssetData(tokenB, [tokenIdA], [valueB], NULL_BYTES),
                );
                expect(isEquivalent).to.be.false();
            });
            it('should fail if ERC1155 is a different ERC1155 token', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], NULL_BYTES),
                    assetDataUtils.encodeERC1155AssetData(tokenB, [tokenIdA, tokenIdB], [valueA, valueB], NULL_BYTES),
                );
                expect(isEquivalent).to.be.false();
            });
            it('should fail if expected ERC1155 has different callback data', () => {
                const isEquivalent = utils.isAssetDataEquivalent(
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdB, tokenIdA], [valueB, valueA], tokenA),
                    assetDataUtils.encodeERC1155AssetData(tokenA, [tokenIdA, tokenIdB], [valueA, valueB], NULL_BYTES),
                );
                expect(isEquivalent).to.be.false();
            });
        });
    });
});
