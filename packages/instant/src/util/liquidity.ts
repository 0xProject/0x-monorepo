import { assert } from '@0x/assert';

export const checkErc20TokenLiquidity = (sraApiUrl: string, erc20TokenAddress: string) => {
    // assert valid Url
    assert.isWebUri('sraApiUrl', sraApiUrl);
    // assert valid erc20tokenaddress
    assert.isETHAddressHex('erc20TokenAddress', erc20TokenAddress);
};
