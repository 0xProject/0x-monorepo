import { Styles } from '@0x/react-shared';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';

import { Blockchain } from 'ts/blockchain';
import { TokenAmountInput } from 'ts/components/inputs/token_amount_input';
import { Container } from 'ts/components/ui/container';
import { EthAmountInput } from 'ts/containers/inputs/eth_amount_input';
import { Dispatcher } from 'ts/redux/dispatcher';
import { colors } from 'ts/style/colors';
import { BlockchainCallErrs, Side, Token } from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

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
    topLabel: {
        color: colors.black,
        fontSize: 11,
    },
    inputContainer: {
        backgroundColor: colors.white,
        borderBottomRightRadius: 3,
        borderBottomLeftRadius: 3,
        borderTopRightRadius: 3,
        borderTopLeftRadius: 3,
        padding: 4,
    },
    amountInput: {
        height: 34,
    },
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
    conversionSpinner: {
        paddingTop: 26,
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
        const isWrappingEth = this.props.direction === Side.Deposit;
        const topLabelText = isWrappingEth ? 'Convert ETH into WETH 1:1' : 'Convert WETH into ETH 1:1';
        return (
            <Container className="flex" backgroundColor={colors.walletFocusedItemBackground} paddingTop="25px">
                <div>{this._renderIsEthConversionHappeningSpinner()} </div>
                <div className="flex flex-column">
                    <div style={styles.topLabel}>{topLabelText}</div>
                    <div className="flex items-center">
                        <div style={styles.inputContainer}>
                            {isWrappingEth ? (
                                <EthAmountInput
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
                        <div>{this._renderWrapEtherConfirmationButton()}</div>
                    </div>

                    {this._renderErrorMsg()}
                </div>
            </Container>
        );
    }
    private _onValueChange(_isValid: boolean, amount?: BigNumber): void {
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
        const visibility = this.state.isEthConversionHappening ? 'visible' : 'hidden';
        const style: React.CSSProperties = { ...styles.conversionSpinner, visibility };
        return (
            <div className="pl3 pr2" style={style}>
                <i className="zmdi zmdi-spinner zmdi-hc-spin" />
            </div>
        );
    }
    private _renderWrapEtherConfirmationButton(): React.ReactElement<{}> {
        const isWrappingEth = this.props.direction === Side.Deposit;
        const labelText = isWrappingEth ? 'wrap' : 'unwrap';
        return (
            <div className="pl1 pr3">
                <FlatButton
                    backgroundColor={colors.wrapEtherConfirmationButton}
                    label={labelText}
                    style={{ zIndex: 0 }}
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
        const etherToken = this.props.etherToken;
        const amountToConvert = this.state.currentInputAmount;
        const ethAmount = Web3Wrapper.toUnitAmount(amountToConvert, constants.DECIMAL_PLACES_ETH).toString();
        const tokenAmount = Web3Wrapper.toUnitAmount(amountToConvert, etherToken.decimals).toString();
        try {
            if (this.props.direction === Side.Deposit) {
                await this.props.blockchain.convertEthToWrappedEthTokensAsync(etherToken.address, amountToConvert);
                this.props.dispatcher.showFlashMessage(`Successfully wrapped ${ethAmount} ETH to WETH`);
                analytics.track('Wrap ETH Success', {
                    amount: ethAmount,
                });
            } else {
                await this.props.blockchain.convertWrappedEthTokensToEthAsync(etherToken.address, amountToConvert);
                this.props.dispatcher.showFlashMessage(`Successfully unwrapped ${tokenAmount} WETH to ETH`);
                analytics.track('Unwrap WETH Success', {
                    amount: tokenAmount,
                });
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
                if (this.props.direction === Side.Deposit) {
                    this.props.dispatcher.showFlashMessage('Failed to wrap your ETH. Please try again.');
                    analytics.track('Wrap ETH Failure', {
                        amount: ethAmount,
                    });
                } else {
                    this.props.dispatcher.showFlashMessage('Failed to unwrap your WETH. Please try again.');
                    analytics.track('Unwrap WETH Failed', {
                        amount: tokenAmount,
                    });
                }
                errorReporter.report(err);
            }
        }
        this.setState({
            isEthConversionHappening: false,
        });
    }
}
