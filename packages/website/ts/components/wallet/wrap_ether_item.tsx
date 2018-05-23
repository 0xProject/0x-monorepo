import { Styles } from '@0xproject/react-shared';
import { BigNumber, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import FlatButton from 'material-ui/FlatButton';
import { ListItem } from 'material-ui/List';
import * as React from 'react';

import { Blockchain } from 'ts/blockchain';
import { EthAmountInput } from 'ts/components/inputs/eth_amount_input';
import { TokenAmountInput } from 'ts/components/inputs/token_amount_input';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BlockchainCallErrs, Side, Token } from 'ts/types';
import { colors } from 'ts/utils/colors';
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
    isEthConversionHappening: boolean;
    errorMsg: React.ReactNode;
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
    amountInput: { height: 34 },
    amountInputLabel: {
        paddingTop: 10,
        paddingRight: 10,
        paddingLeft: 5,
        color: colors.grey,
        fontSize: 14,
    },
    amountInputHint: {
        bottom: 18,
    },
    innerDiv: { paddingLeft: 60, paddingTop: 0, paddingBottom: 10 },
    wrapEtherConfirmationButtonContainer: { width: 128, top: 19 },
    wrapEtherConfirmationButtonLabel: {
        fontSize: 12,
        color: colors.white,
    },
    errorMsg: {
        fontSize: 12,
        marginTop: 4,
        color: colors.red,
        minHeight: 20,
    },
};

export class WrapEtherItem extends React.Component<WrapEtherItemProps, WrapEtherItemState> {
    constructor(props: WrapEtherItemProps) {
        super(props);
        this.state = {
            currentInputAmount: undefined,
            isEthConversionHappening: false,
            errorMsg: null,
        };
    }
    public render(): React.ReactNode {
        const etherBalanceInEth = Web3Wrapper.toUnitAmount(
            this.props.userEtherBalanceInWei,
            constants.DECIMAL_PLACES_ETH,
        );
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
                                    style={styles.amountInput}
                                    labelStyle={styles.amountInputLabel}
                                    inputHintStyle={styles.amountInputHint}
                                    onErrorMsgChange={this._onErrorMsgChange.bind(this)}
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
                                    shouldShowErrs={false}
                                    shouldShowUnderline={false}
                                    style={styles.amountInput}
                                    labelStyle={styles.amountInputLabel}
                                    inputHintStyle={styles.amountInputHint}
                                    onErrorMsgChange={this._onErrorMsgChange.bind(this)}
                                />
                            )}
                        </div>
                        {this._renderErrorMsg()}
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
        });
    }
    private _onErrorMsgChange(errorMsg: React.ReactNode): void {
        this.setState({
            errorMsg,
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
    private _renderErrorMsg(): React.ReactNode {
        return <div style={styles.errorMsg}>{this.state.errorMsg}</div>;
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
                const ethAmount = Web3Wrapper.toUnitAmount(amountToConvert, constants.DECIMAL_PLACES_ETH);
                this.props.dispatcher.showFlashMessage(`Successfully wrapped ${ethAmount.toString()} ETH to WETH`);
            } else {
                await this.props.blockchain.convertWrappedEthTokensToEthAsync(etherToken.address, amountToConvert);
                const tokenAmount = Web3Wrapper.toUnitAmount(amountToConvert, etherToken.decimals);
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
