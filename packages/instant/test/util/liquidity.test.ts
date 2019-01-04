import * as fetchMock from 'fetch-mock';

import { checkErc20TokenLiquidityAsync } from '../../src/util/liquidity';

const ZRX_ADDRESS = '0xe41d2489571d322189246dafa5ebde1f4699f498';
const OMG_ADDRESS = '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07';
const PPC_ADDRESS = '0x5a3c9a1725aa82690ee0959c89abe96fd1b527ee';
const SRA_URL = 'https://api.radarrelay.com/0x/v2/';

describe('liquidity', () => {
    beforeEach(() => {
        fetchMock.restore();
    });
    describe('checkErc20TokenLiquidity', () => {
        describe('validation', () => {
            it('should raise if invalid url', () => {
                expect(checkErc20TokenLiquidityAsync('abc', ZRX_ADDRESS)).rejects.toThrowError(
                    'Expected sraApiUrl to be of type web uri, encountered: abc',
                );
            });
            it('should raise if invalid token address', () => {
                expect(checkErc20TokenLiquidityAsync(SRA_URL, 'xyz')).rejects.toThrowError(
                    'Expected erc20TokenAddress to be of type ETHAddressHex, encountered: xyz',
                );
            });
            describe('supported', () => {
                const OMG_ASSET_PAIR_REQUEST_URL =
                    'https://api.radarrelay.com/0x/v2/asset_pairs?assetDataA=0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&assetDataB=0xf47261b0000000000000000000000000d26114cd6ee289accf82350c8d8487fedb8a0c07&networkId=1&perPage=1000';
                const OMG_ASSET_PAIR_RESPONSE = {
                    total: 1,
                    page: 1,
                    perPage: 1000,
                    records: [
                        {
                            assetDataA: {
                                assetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                                precision: 8,
                                minAmount: '0',
                                maxAmount: '999999999999999999999',
                            },
                            assetDataB: {
                                assetData: '0xf47261b0000000000000000000000000d26114cd6ee289accf82350c8d8487fedb8a0c07',
                                precision: 8,
                                minAmount: '0',
                                maxAmount: '999999999999999999999',
                            },
                        },
                    ],
                };

                const PPC_ASSET_PAIR_REQUEST_URL =
                    'https://api.radarrelay.com/0x/v2/asset_pairs?assetDataA=0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&assetDataB=0xf47261b00000000000000000000000005a3c9a1725aa82690ee0959c89abe96fd1b527ee&networkId=1&perPage=1000';
                const PPC_ASSET_PAIR_RESPONSE = { total: 0, page: 1, perPage: 1000, records: [] };

                it('should return true if SRA does support support', async () => {
                    fetchMock.get(OMG_ASSET_PAIR_REQUEST_URL, OMG_ASSET_PAIR_RESPONSE);

                    const result = await checkErc20TokenLiquidityAsync(SRA_URL, OMG_ADDRESS);
                    expect(result.supported).toEqual(true);
                });
                it('should return false if SRA doesnt support', async () => {
                    fetchMock.get(PPC_ASSET_PAIR_REQUEST_URL, PPC_ASSET_PAIR_RESPONSE);
                    const result = await checkErc20TokenLiquidityAsync(SRA_URL, PPC_ADDRESS);
                    expect(result.supported).toEqual(false);
                });
            });
        });
    });
});
