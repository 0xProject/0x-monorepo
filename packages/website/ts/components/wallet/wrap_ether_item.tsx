import { ZeroEx } from '0x.js';
import { colors, Styles } from '@0xproject/react-shared';
import { BigNumber, logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import FlatButton from 'material-ui/FlatButton';
import { ListItem } from 'material-ui/List';
import * as React from 'react';

import { Blockchain } from 'ts/blockchain';
import { EthAmountInput } from 'ts/components/inputs/eth_amount_input';
import { TokenAmountInput } from 'ts/components/inputs/token_amount_input';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BlockchainCallErrs, Side, Token } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';
import { styles as walletItemStyles } from 'ts/utils/wallet_item_styles';

export interface WrapEtherItemProps {
    userAddress: string;
    networkId: number;
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    userEtherBalanceInWei: BigNumber;
    direction: Side;
    etherToken: Token;
    lastForceTokenStateRefetch: number;
    onConversionSuccessful?: () => void;
    refetchEthTokenStateAsync: () => Promise<void>;
}

interface WrapEtherItemState {
    currentInputAmount?: BigNumber;
    currentInputHasErrors: boolean;
    isEthConversionHappening: boolean;
}

const styles: Styles = {
    topLabel: { color: colors.black, fontSize: 11 },
    inputContainer: {
        backgroundColor: colors.white,
        borderBottomRightRadius: 3,
        borderBottomLeftRadius: 3,
        borderTopRightRadius: 3,
        borderTopLeftRadius: 3,
        padding: 4,
        width: 125,
    },
    ethAmountInput: { height: 32 },
    innerDiv: { paddingLeft: 60, paddingTop: 0 },
    wrapEtherConfirmationButtonContainer: { width: 128, top: 16 },
    wrapEtherConfirmationButtonLabel: {
        fontSize: 10,
        color: colors.white,
    },
};

export class WrapEtherItem extends React.Component<WrapEtherItemProps, WrapEtherItemState> {
    constructor(props: WrapEtherItemProps) {
        super(props);
        this.state = {
            currentInputAmount: undefined,
            currentInputHasErrors: false,
            isEthConversionHappening: false,
        };
    }
    public render(): React.ReactNode {
        const etherBalanceInEth = ZeroEx.toUnitAmount(this.props.userEtherBalanceInWei, constants.DECIMAL_PLACES_ETH);
        const isWrappingEth = this.props.direction === Side.Deposit;
        const topLabelText = isWrappingEth ? 'Convert ETH into WETH 1:1' : 'Convert WETH into ETH 1:1';
        return (
            <ListItem
                primaryText={
                    <div>
                        <div style={styles.topLabel}>{topLabelText}</div>
                        <div style={styles.inputContainer}>
                            {isWrappingEth ? (
                                <EthAmountInput
                                    balance={etherBalanceInEth}
                                    amount={this.state.currentInputAmount}
                                    hintText="0.00"
                                    onChange={this._onValueChange.bind(this)}
                                    shouldCheckBalance={true}
                                    shouldShowIncompleteErrs={false}
                                    shouldShowErrs={false}
                                    shouldShowUnderline={false}
                                    style={styles.ethAmountInput}
                                />
                            ) : (
                                <TokenAmountInput
                                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                                    blockchain={this.props.blockchain}
                                    userAddress={this.props.userAddress}
                                    networkId={this.props.networkId}
                                    token={this.props.etherToken}
                                    shouldShowIncompleteErrs={false}
                                    shouldCheckBalance={true}
                                    shouldCheckAllowance={false}
                                    onChange={this._onValueChange.bind(this)}
                                    amount={this.state.currentInputAmount}
                                    hintText="0.00"
                                    shouldShowErrs={false} // TODO: error handling
                                    shouldShowUnderline={false}
                                    style={styles.ethAmountInput}
                                />
                            )}
                        </div>
                    </div>
                }
                secondaryTextLines={2}
                disableTouchRipple={true}
                style={walletItemStyles.focusedItem}
                innerDivStyle={styles.innerDiv}
                leftIcon={this._renderIsEthConversionHappeningSpinner()}
                rightAvatar={this._renderWrapEtherConfirmationButton()}
            />
        );
    }
    private _onValueChange(isValid: boolean, amount?: BigNumber): void {
        this.setState({
            currentInputAmount: amount,
            currentInputHasErrors: !isValid,
        });
    }
    private _renderIsEthConversionHappeningSpinner(): React.ReactElement<{}> {
        return this.state.isEthConversionHappening ? (
            <div className="pl1" style={{ paddingTop: 10 }}>
                <i className="zmdi zmdi-spinner zmdi-hc-spin" />
            </div>
        ) : null;
    }
    private _renderWrapEtherConfirmationButton(): React.ReactElement<{}> {
        const isWrappingEth = this.props.direction === Side.Deposit;
        const labelText = isWrappingEth ? 'wrap' : 'unwrap';
        return (
            <div style={styles.wrapEtherConfirmationButtonContainer}>
                <FlatButton
                    backgroundColor={colors.wrapEtherConfirmationButton}
                    label={labelText}
                    labelStyle={styles.wrapEtherConfirmationButtonLabel}
                    onClick={this._wrapEtherConfirmationActionAsync.bind(this)}
                    disabled={this.state.isEthConversionHappening}
                />
            </div>
        );
    }
    private async _wrapEtherConfirmationActionAsync(): Promise<void> {
        this.setState({
            isEthConversionHappening: true,
        });
        try {
            const etherToken = this.props.etherToken;
            const amountToConvert = this.state.currentInputAmount;
            if (this.props.direction === Side.Deposit) {
                await this.props.blockchain.convertEthToWrappedEthTokensAsync(etherToken.address, amountToConvert);
                const ethAmount = ZeroEx.toUnitAmount(amountToConvert, constants.DECIMAL_PLACES_ETH);
                this.props.dispatcher.showFlashMessage(`Successfully wrapped ${ethAmount.toString()} ETH to WETH`);
            } else {
                await this.props.blockchain.convertWrappedEthTokensToEthAsync(etherToken.address, amountToConvert);
                const tokenAmount = ZeroEx.toUnitAmount(amountToConvert, etherToken.decimals);
                this.props.dispatcher.showFlashMessage(`Successfully unwrapped ${tokenAmount.toString()} WETH to ETH`);
            }
            await this.props.refetchEthTokenStateAsync();
            this.props.onConversionSuccessful();
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, BlockchainCallErrs.UserHasNoAssociatedAddresses)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            } else if (!utils.didUserDenyWeb3Request(errMsg)) {
                logUtils.log(`Unexpected error encountered: ${err}`);
                logUtils.log(err.stack);
                const errorMsg =
                    this.props.direction === Side.Deposit
                        ? 'Failed to wrap your ETH. Please try again.'
                        : 'Failed to unwrap your WETH. Please try again.';
                this.props.dispatcher.showFlashMessage(errorMsg);
                await errorReporter.reportAsync(err);
            }
        }
        this.setState({
            isEthConversionHappening: false,
        });
    }
}
