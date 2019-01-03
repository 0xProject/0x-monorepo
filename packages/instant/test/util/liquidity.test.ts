import { checkErc20TokenLiquidity } from '../../src/util/liquidity';

const ZRX_ADDRESS = '0xe41d2489571d322189246dafa5ebde1f4699f498';
const SRA_URL = 'https://api.radarrelay.com/0x/v2/';

describe('liquidity', () => {
    describe('checkErc20TokenLiquidity', () => {
        describe('validation', () => {
            it('should raise if invalid url', () => {
                expect(() => {
                    checkErc20TokenLiquidity('abc', ZRX_ADDRESS);
                }).toThrowError('Expected sraApiUrl to be of type web uri, encountered: abc');
            });
            it('should raise if invalid token address', () => {
                expect(() => {
                    checkErc20TokenLiquidity(SRA_URL, 'xyz');
                }).toThrowError('Expected erc20TokenAddress to be of type ETHAddressHex, encountered: xyz');
            });
        });
    });
});
