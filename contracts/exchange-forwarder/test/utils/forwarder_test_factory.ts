import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { chaiSetup, constants, ERC20BalancesByOwner, web3Wrapper } from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';

import { ForwarderWrapper } from './forwarder_wrapper';

chaiSetup.configure();
const expect = chai.expect;

// TODO: move these somewhere?
const enum OrderFee {
    NoFee,
    Percentage,
    Weth,
}

interface ForwarderFillState {
    takerAssetFillAmount: BigNumber;
    makerAssetFillAmount: BigNumber;
    wethFees: BigNumber;
    percentageFees: BigNumber;
    maxOversoldWeth: BigNumber;
    maxOverboughtMakerAsset: BigNumber;
}

function getFeeType(order: SignedOrder): OrderFee {
    if (order.takerFee.eq(new BigNumber(0))) {
        return OrderFee.NoFee;
    } else if (order.takerFeeAssetData === order.makerAssetData) {
        return OrderFee.Percentage;
    } else {
        return OrderFee.Weth;
    }
}

export class ForwarderTestFactory {
    private readonly _forwarderWrapper: ForwarderWrapper;
    private readonly _erc20Wrapper: ERC20Wrapper;
    private readonly _forwarderAddress: string;
    private readonly _makerAddress: string;
    private readonly _takerAddress: string;
    private readonly _orderFeeRecipientAddress: string;
    private readonly _forwarderFeeRecipientAddress: string;
    private readonly _gasPrice: BigNumber;
    private readonly _wethAddress: string;

    constructor(
        forwarderWrapper: ForwarderWrapper,
        erc20Wrapper: ERC20Wrapper,
        forwarderAddress: string,
        makerAddress: string,
        takerAddress: string,
        orderFeeRecipientAddress: string,
        forwarderFeeRecipientAddress: string,
        gasPrice: BigNumber,
        wethAddress: string,
    ) {
        this._forwarderWrapper = forwarderWrapper;
        this._erc20Wrapper = erc20Wrapper;
        this._forwarderAddress = forwarderAddress;
        this._makerAddress = makerAddress;
        this._takerAddress = takerAddress;
        this._orderFeeRecipientAddress = orderFeeRecipientAddress;
        this._forwarderFeeRecipientAddress = forwarderFeeRecipientAddress;
        this._gasPrice = gasPrice;
        this._wethAddress = wethAddress;
    }

    // TODO: different assets (ERC721), rounding, forwarder fees
    public async generateTestAsync(
        orders: SignedOrder[],
        makerAssetAddress: string,
        takerEthBalanceBefore: BigNumber,
        erc20Balances: ERC20BalancesByOwner,
    ): Promise<void> {
        // Simulates filling all but the last order, which will be partially filled
        const expectedResults = orders
            .reduce(
                (prev: ForwarderFillState, order: SignedOrder, currentIndex: number) => {
                    const current = { ...prev };
                    const { makerAssetAmount, takerAssetAmount, takerFee } = currentIndex === (orders.length - 1) ?
                        {
                            makerAssetAmount: order.makerAssetAmount.dividedToIntegerBy(2),
                            takerAssetAmount: order.takerAssetAmount.dividedToIntegerBy(2),
                            takerFee: order.takerFee.dividedToIntegerBy(2),
                        } : order;

                    current.takerAssetFillAmount = current.takerAssetFillAmount.plus(
                        takerAssetAmount,
                    );
                    current.makerAssetFillAmount = current.makerAssetFillAmount.plus(
                        makerAssetAmount,
                    );

                    switch (getFeeType(order)) {
                        case OrderFee.Percentage:
                            current.percentageFees = current.percentageFees.plus(takerFee);
                            break;
                        case OrderFee.Weth:
                            current.wethFees = current.wethFees.plus(takerFee);
                            current.maxOversoldWeth = current.maxOversoldWeth.plus(new BigNumber(1));
                            current.maxOverboughtMakerAsset = current.maxOversoldWeth
                                .times(makerAssetAmount)
                                .dividedToIntegerBy(takerAssetAmount);
                            break;
                        default:
                    }
                    return current;
                },
                {
                    takerAssetFillAmount: new BigNumber(0),
                    makerAssetFillAmount: new BigNumber(0),
                    wethFees: new BigNumber(0),
                    percentageFees: new BigNumber(0),
                    maxOversoldWeth: new BigNumber(0),
                    maxOverboughtMakerAsset: new BigNumber(0),
                },
            );

        const ethValue = expectedResults.takerAssetFillAmount.plus(expectedResults.wethFees);
        const tx = await this._forwarderWrapper.marketSellOrdersWithEthAsync(orders, {
            value: ethValue,
            from: this._takerAddress,
        });
        const totalEthSpent = ethValue.plus(this._gasPrice.times(tx.gasUsed));

        const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(this._takerAddress);
        const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(this._forwarderAddress);
        const newBalances = await this._erc20Wrapper.getBalancesAsync();

        expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));

        expect(newBalances[this._makerAddress][makerAssetAddress]).to.be.bignumber.equal(
            erc20Balances[this._makerAddress][makerAssetAddress].minus(expectedResults.makerAssetFillAmount),
        );
        expect(newBalances[this._takerAddress][makerAssetAddress]).to.be.bignumber.equal(
            erc20Balances[this._takerAddress][makerAssetAddress].plus(expectedResults.makerAssetFillAmount).minus(expectedResults.percentageFees),
        );
        expect(newBalances[this._orderFeeRecipientAddress][makerAssetAddress]).to.be.bignumber.equal(
            erc20Balances[this._orderFeeRecipientAddress][makerAssetAddress].plus(expectedResults.percentageFees),
        );

        expect(newBalances[this._makerAddress][this._wethAddress]).to.be.bignumber.equal(
            erc20Balances[this._makerAddress][this._wethAddress].plus(expectedResults.takerAssetFillAmount).minus(expectedResults.wethFees),
        );
        expect(newBalances[this._orderFeeRecipientAddress][this._wethAddress]).to.be.bignumber.equal(
            erc20Balances[this._orderFeeRecipientAddress][this._wethAddress].plus(expectedResults.wethFees),
        );

        expect(newBalances[this._forwarderAddress][this._wethAddress]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        expect(newBalances[this._forwarderAddress][makerAssetAddress]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
    }
}
