import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import {Blockchain} from 'ts/blockchain';
import {EthWethConversionDialog} from 'ts/components/dialogs/eth_weth_conversion_dialog';
import {Dispatcher} from 'ts/redux/dispatcher';
import {BlockchainCallErrs, Side, Token, TokenState} from 'ts/types';
import {constants} from 'ts/utils/constants';
import {errorReporter} from 'ts/utils/error_reporter';
import {utils} from 'ts/utils/utils';

interface EthWethConversionButtonProps {
    direction: Side;
    ethToken: Token;
    ethTokenState: TokenState;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
    userEtherBalance: BigNumber;
    isOutdatedWrappedEther: boolean;
    onConversionSuccessful?: () => void;
    isDisabled?: boolean;
}

interface EthWethConversionButtonState {
    isEthConversionDialogVisible: boolean;
    isEthConversionHappening: boolean;
}

export class EthWethConversionButton extends
    React.Component<EthWethConversionButtonProps, EthWethConversionButtonState> {
    public static defaultProps: Partial<EthWethConversionButtonProps> = {
        isDisabled: false,
        onConversionSuccessful: _.noop,
    };
    public constructor(props: EthWethConversionButtonProps) {
        super(props);
        this.state = {
            isEthConversionDialogVisible: false,
            isEthConversionHappening: false,
        };
    }
    public render() {
        const labelStyle = this.state.isEthConversionHappening ? {fontSize: 10} : {};
        let callToActionLabel;
        let inProgressLabel;
        if (this.props.direction === Side.Deposit) {
            callToActionLabel = 'Wrap';
            inProgressLabel = 'Wrapping...';
        } else {
            callToActionLabel = 'Unwrap';
            inProgressLabel = 'Unwrapping...';
        }
        return (
            <div>
                <RaisedButton
                    style={{width: '100%'}}
                    labelStyle={labelStyle}
                    disabled={this.props.isDisabled || this.state.isEthConversionHappening}
                    label={this.state.isEthConversionHappening ? inProgressLabel : callToActionLabel}
                    onClick={this.toggleConversionDialog.bind(this)}
                />
                <EthWethConversionDialog
                    direction={this.props.direction}
                    isOpen={this.state.isEthConversionDialogVisible}
                    onComplete={this.onConversionAmountSelectedAsync.bind(this)}
                    onCancelled={this.toggleConversionDialog.bind(this)}
                    etherBalance={this.props.userEtherBalance}
                    token={this.props.ethToken}
                    tokenState={this.props.ethTokenState}
                />
            </div>
        );
    }
    private toggleConversionDialog() {
        this.setState({
            isEthConversionDialogVisible: !this.state.isEthConversionDialogVisible,
        });
    }
    private async onConversionAmountSelectedAsync(direction: Side, value: BigNumber) {
        this.setState({
            isEthConversionHappening: true,
        });
        this.toggleConversionDialog();
        const token = this.props.ethToken;
        const tokenState = this.props.ethTokenState;
        let balance = tokenState.balance;
        try {
            if (direction === Side.Deposit) {
                await this.props.blockchain.convertEthToWrappedEthTokensAsync(value);
                const ethAmount = ZeroEx.toUnitAmount(value, constants.ETH_DECIMAL_PLACES);
                this.props.dispatcher.showFlashMessage(`Successfully wrapped ${ethAmount.toString()} ETH to WETH`);
                balance = balance.plus(value);
            } else {
                await this.props.blockchain.convertWrappedEthTokensToEthAsync(value);
                const tokenAmount = ZeroEx.toUnitAmount(value, token.decimals);
                this.props.dispatcher.showFlashMessage(`Successfully unwrapped ${tokenAmount.toString()} WETH to ETH`);
                balance = balance.minus(value);
            }
            if (!this.props.isOutdatedWrappedEther) {
                this.props.dispatcher.replaceTokenBalanceByAddress(token.address, balance);
            }
            this.props.onConversionSuccessful();
        } catch (err) {
            const errMsg = '' + err;
            if (_.includes(errMsg, BlockchainCallErrs.USER_HAS_NO_ASSOCIATED_ADDRESSES)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            } else if (!_.includes(errMsg, 'User denied transaction')) {
                utils.consoleLog(`Unexpected error encountered: ${err}`);
                utils.consoleLog(err.stack);
                await errorReporter.reportAsync(err);
                const errorMsg = direction === Side.Deposit ?
                                 'Failed to wrap your ETH. Please try again.' :
                                 'Failed to unwrap your WETH. Please try again.';
                this.props.dispatcher.showFlashMessage(errorMsg);
            }
        }
        this.setState({
            isEthConversionHappening: false,
        });
    }
}
