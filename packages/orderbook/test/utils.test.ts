import { utils } from '../src/utils';

describe('Utils', () => {
    describe('.getOrderHash', () => {
        const order = {
            makerAddress: '0x50f84bbee6fb250d6f49e854fa280445369d64d9',
            makerAssetData: '0xf47261b00000000000000000000000000f5d2fb29fb7d3cfee444a200298f468908cc942',
            makerAssetAmount: '4424020538752105500000',
            makerFee: '0',
            takerAddress: '0x0000000000000000000000000000000000000000',
            takerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            takerAssetAmount: '1000000000000000061',
            takerFee: '0',
            senderAddress: '0x0000000000000000000000000000000000000000',
            exchangeAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
            feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
            expirationTimeSeconds: '1559422407',
            salt: '1559422141994',
            signature:
                '0x1cf16c2f3a210965b5e17f51b57b869ba4ddda33df92b0017b4d8da9dacd3152b122a73844eaf50ccde29a42950239ba36a525ed7f1698a8a5e1896cf7d651aed203',
        };
        test('calculates the orderhash if it does not exist', async () => {
            const orderHash = utils.getOrderHash(order as any);
            const calculatedOrderHash = utils.getOrderHash({ order: order as any, metaData: {} });
            expect(orderHash).toBe(calculatedOrderHash);
            expect(orderHash).toBe('0x96e6eb6174dbf0458686bdae44c9a330d9a9eb563962512a7be545c4ecc13fd4');
        });
    });
    describe('.attemptAsync', () => {
        test('attempts the operation multiple times if the operation throws', async () => {
            const success = 'Success';
            const mock = jest
                .fn()
                .mockRejectedValueOnce(new Error('Async Error'))
                .mockResolvedValue(success);
            const result = await utils.attemptAsync<string>(mock);
            expect(result).toBe(success);
            expect(mock.mock.calls.length).toBe(2);
        });
    });
});
