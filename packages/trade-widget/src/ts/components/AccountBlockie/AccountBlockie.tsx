import { ZeroEx } from '0x.js';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Button, Content, Field, Label } from 'bloomer';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Web3 from 'web3';

import { AssetToken } from '../../types';

import { Blockie } from './Blockie';

const ETH_DECIMAL_PLACES = 18;

/**
 * AccountBlockie properties.
 */
interface AccountBlockieProps {
    /** account the account to display in the component, used to seed the image */
    account?: string;
    /** weiBalance the balance to display in the component */
    weiBalance: BigNumber;
    /** selectedToken the token to display in the component */
    selectedToken: AssetToken;
    /** tokenBalance the token balance to display in the component */
    tokenBalance: BigNumber;
}

/**
 * AccountBlockie displays an image of the given account to give a visual representation of the address
 */
class AccountBlockie extends React.Component<AccountBlockieProps, {}> {
    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        if (!this.props.account) {
            return (
                <Content>
                    <Field hasAddons={'centered'}>
                        <Button isColor="white" isLoading={true}>
                            isLoading={true}
                        </Button>
                    </Field>
                </Content>
            );
        }
        return (
            <Content>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Blockie style={{ 'border-radius': '50%' }} seed={this.props.account} />
                </Field>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Label style={{ color: '#3636367d' }} isSize={'small'}>
                        {' '}
                        {this._renderMinimisedAccount()}{' '}
                    </Label>
                </Field>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Label isSize={'small'}> {this._renderEthBalance()} ETH</Label>
                </Field>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Label isSize={'small'}>
                        {' '}
                        {this._renderTokenBalance()} {this.props.selectedToken}
                    </Label>
                </Field>
            </Content>
        );
    }
    private _renderEthBalance(): string {
        const { weiBalance } = this.props;
        return weiBalance
            ? ZeroEx.toUnitAmount(weiBalance, ETH_DECIMAL_PLACES)
                  .toFixed(4)
                  .toString()
            : '';
    }
    private _renderTokenBalance(): string {
        const { tokenBalance } = this.props;
        return tokenBalance
            ? ZeroEx.toUnitAmount(tokenBalance, ETH_DECIMAL_PLACES)
                  .toFixed(0)
                  .toString()
            : '';
    }
    private _renderMinimisedAccount(): string {
        //   0xea95a7...609353b2
        const account = this.props.account;
        const initial = account.substring(0, 6);
        const end = account.substring(account.length - 6, account.length);
        const minimised = `${initial}...${end}`;
        return minimised;
    }
}

export { AccountBlockie, AccountBlockieProps };
