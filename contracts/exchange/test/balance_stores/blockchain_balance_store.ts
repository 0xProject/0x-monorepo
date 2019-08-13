import { ERC1155ProxyWrapper, ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';

import { BalanceStore } from './balance_store';

export class BlockchainBalanceStore extends BalanceStore {
    private readonly _erc20Wrapper: ERC20Wrapper;
    private readonly _erc721Wrapper: ERC721Wrapper;
    private readonly _erc1155ProxyWrapper: ERC1155ProxyWrapper;

    /**
     * Constructor.
     * @param erc20Wrapper The ERC20 Wrapper used to interface with deployed erc20 tokens.
     * @param erc721Wrapper The ERC721 Wrapper used to interface with deployed erc20 tokens.
     * @param erc1155ProxyWrapper The ERC1155 Proxy Wrapper used to interface with deployed erc20 tokens.
     */
    public constructor(
        erc20Wrapper: ERC20Wrapper,
        erc721Wrapper: ERC721Wrapper,
        erc1155ProxyWrapper: ERC1155ProxyWrapper,
    ) {
        super();
        this._erc20Wrapper = erc20Wrapper;
        this._erc721Wrapper = erc721Wrapper;
        this._erc1155ProxyWrapper = erc1155ProxyWrapper;
    }

    /**
     * Updates balances by querying on-chain values managed by the erc20, erc721, and erc1155 wrappers.
     */
    public async updateBalancesAsync(): Promise<void> {
        const [erc20, erc721, erc1155] = await Promise.all([
            this._erc20Wrapper.getBalancesAsync(),
            this._erc721Wrapper.getBalancesAsync(),
            this._erc1155ProxyWrapper.getBalancesAsync(),
        ]);
        this._balances.erc20 = erc20;
        this._balances.erc721 = erc721;
        this._balances.erc1155 = BalanceStore._transformERC1155Holdings(erc1155);
    }
}
