import { colors } from '@0x/react-shared';
import * as _ from 'lodash';
import TextField from 'material-ui/TextField';
import * as moment from 'moment';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { AddressInput } from 'ts/components/inputs/address_input';
import { Alert } from 'ts/components/ui/alert';
import { LifeCycleRaisedButton } from 'ts/components/ui/lifecycle_raised_button';
import { RequiredLabel } from 'ts/components/ui/required_label';
import { AlertTypes, Token, TokenByAddress } from 'ts/types';

interface NewTokenFormProps {
    blockchain: Blockchain;
    tokenByAddress: TokenByAddress;
    onNewTokenSubmitted: (token: Token) => void;
}

interface NewTokenFormState {
    globalErrMsg: string;
    name: string;
    nameErrText: string;
    symbol: string;
    symbolErrText: string;
    address: string;
    shouldShowAddressIncompleteErr: boolean;
    decimals: string;
    decimalsErrText: string;
}

export class NewTokenForm extends React.Component<NewTokenFormProps, NewTokenFormState> {
    constructor(props: NewTokenFormProps) {
        super(props);
        this.state = {
            address: '',
            globalErrMsg: '',
            name: '',
            nameErrText: '',
            shouldShowAddressIncompleteErr: false,
            symbol: '',
            symbolErrText: '',
            decimals: '18',
            decimalsErrText: '',
        };
    }
    public render(): React.ReactNode {
        return (
            <div className="mx-auto pb2" style={{ width: 256 }}>
                <div>
                    <TextField
                        floatingLabelFixed={true}
                        floatingLabelStyle={{ color: colors.grey }}
                        floatingLabelText={<RequiredLabel label="Name" />}
                        value={this.state.name}
                        errorText={this.state.nameErrText}
                        onChange={this._onTokenNameChanged.bind(this)}
                    />
                </div>
                <div>
                    <TextField
                        floatingLabelFixed={true}
                        floatingLabelStyle={{ color: colors.grey }}
                        floatingLabelText={<RequiredLabel label="Symbol" />}
                        value={this.state.symbol}
                        errorText={this.state.symbolErrText}
                        onChange={this._onTokenSymbolChanged.bind(this)}
                    />
                </div>
                <div>
                    <AddressInput
                        isRequired={true}
                        label="Contract address"
                        initialAddress=""
                        shouldShowIncompleteErrs={this.state.shouldShowAddressIncompleteErr}
                        updateAddress={this._onTokenAddressChanged.bind(this)}
                    />
                </div>
                <div>
                    <TextField
                        floatingLabelFixed={true}
                        floatingLabelStyle={{ color: colors.grey }}
                        floatingLabelText={<RequiredLabel label="Decimals" />}
                        value={this.state.decimals}
                        errorText={this.state.decimalsErrText}
                        onChange={this._onTokenDecimalsChanged.bind(this)}
                    />
                </div>
                <div className="pt2 mx-auto" style={{ width: 120 }}>
                    <LifeCycleRaisedButton
                        labelReady="Add"
                        labelLoading="Adding..."
                        labelComplete="Added!"
                        onClickAsyncFn={this._onAddNewTokenClickAsync.bind(this)}
                    />
                </div>
                {this.state.globalErrMsg !== '' && <Alert type={AlertTypes.ERROR} message={this.state.globalErrMsg} />}
            </div>
        );
    }
    private async _onAddNewTokenClickAsync(): Promise<void> {
        // Trigger validation of name and symbol
        this._onTokenNameChanged(undefined, this.state.name);
        this._onTokenSymbolChanged(undefined, this.state.symbol);
        this._onTokenDecimalsChanged(undefined, this.state.decimals);

        const isAddressIncomplete = this.state.address === '';
        let doesContractExist = false;
        if (!isAddressIncomplete) {
            doesContractExist = await this.props.blockchain.doesContractExistAtAddressAsync(this.state.address);
        }

        let hasBalanceAllowanceErr = false;
        if (doesContractExist) {
            try {
                await this.props.blockchain.getCurrentUserTokenBalanceAndAllowanceAsync(this.state.address);
            } catch (err) {
                hasBalanceAllowanceErr = true;
            }
        }

        let globalErrMsg = '';
        if (
            this.state.nameErrText !== '' ||
            this.state.symbolErrText !== '' ||
            this.state.decimalsErrText !== '' ||
            isAddressIncomplete
        ) {
            globalErrMsg = 'Please fix the above issues';
        } else if (!doesContractExist) {
            globalErrMsg = 'No contract found at supplied address';
        } else if (hasBalanceAllowanceErr) {
            globalErrMsg = 'Unsuccessful call to `balanceOf` and/or `allowance` on supplied contract address';
        } else if (!isAddressIncomplete && !_.isUndefined(this.props.tokenByAddress[this.state.address])) {
            globalErrMsg = 'A token already exists with this address';
        }

        if (globalErrMsg !== '') {
            this.setState({
                globalErrMsg,
                shouldShowAddressIncompleteErr: isAddressIncomplete,
            });
            return;
        }

        const newToken: Token = {
            address: this.state.address,
            decimals: _.parseInt(this.state.decimals),
            iconUrl: undefined,
            name: this.state.name,
            symbol: this.state.symbol.toUpperCase(),
            trackedTimestamp: moment().unix(),
            isRegistered: false,
        };
        this.props.onNewTokenSubmitted(newToken);
    }
    private _onTokenNameChanged(_event: any, name: string): void {
        let nameErrText = '';
        const maxLength = 30;
        const tokens = _.values(this.props.tokenByAddress);
        const tokenWithNameIfExists = _.find(tokens, { name });
        const doesTokenWithNameExists = !_.isUndefined(tokenWithNameIfExists);
        if (name === '') {
            nameErrText = 'Name is required';
        } else if (!this._isValidName(name)) {
            nameErrText = 'Name should only contain letters, digits and spaces';
        } else if (name.length > maxLength) {
            nameErrText = `Max length is ${maxLength}`;
        } else if (doesTokenWithNameExists) {
            nameErrText = 'Token with this name already exists';
        }

        this.setState({
            name,
            nameErrText,
        });
    }
    private _onTokenSymbolChanged(_event: any, symbol: string): void {
        let symbolErrText = '';
        const maxLength = 5;
        const tokens = _.values(this.props.tokenByAddress);
        const doesTokenWithSymbolExists = !_.isUndefined(_.find(tokens, { symbol }));
        if (symbol === '') {
            symbolErrText = 'Symbol is required';
        } else if (!this._isAlphanumeric(symbol)) {
            symbolErrText = 'Can only include alphanumeric characters';
        } else if (symbol.length > maxLength) {
            symbolErrText = `Max length is ${maxLength}`;
        } else if (doesTokenWithSymbolExists) {
            symbolErrText = 'Token with symbol already exists';
        }

        this.setState({
            symbol,
            symbolErrText,
        });
    }
    private _onTokenDecimalsChanged(_event: any, decimals: string): void {
        let decimalsErrText = '';
        const maxLength = 2;
        if (decimals === '') {
            decimalsErrText = 'Decimals is required';
        } else if (!this._isInteger(decimals)) {
            decimalsErrText = 'Must be an integer';
        } else if (decimals.length > maxLength) {
            decimalsErrText = `Max length is ${maxLength}`;
        }

        this.setState({
            decimals,
            decimalsErrText,
        });
    }
    private _onTokenAddressChanged(address?: string): void {
        if (!_.isUndefined(address)) {
            this.setState({
                address,
            });
        }
    }
    private _isValidName(input: string): boolean {
        return /^[a-z0-9 ]+$/i.test(input);
    }
    private _isInteger(input: string): boolean {
        return /^[0-9]+$/i.test(input);
    }
    private _isAlphanumeric(input: string): boolean {
        return /^[a-zA-Z0-9]+$/i.test(input);
    }
}
