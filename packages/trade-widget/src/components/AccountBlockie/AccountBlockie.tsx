import { Content, Field, Label } from 'bloomer';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Web3 from 'web3';

import { AssetToken } from '../../types';

import { Blockie } from './Blockie';

/**
 * AccountBlockie properties.
 */
interface AccountBlockieProps {
    /** account the account to display in the component, used to seed the image */
    account?: string;
    /** ethBalance the balance to display in the component */
    ethBalance: string;
    /** selectedToken the token to display in the component */
    selectedToken: AssetToken;
    /** tokenBalance the token balance to display in the component */
    tokenBalance: string;
}

/**
 * AccountBlockie displays an image of the given account to give a visual representation of the address
 */
class AccountBlockie extends React.Component<AccountBlockieProps, {}> {
    // tslint:disable-next-line:prefer-function-over-method member-access
    minimisedAccount(account: string): string {
        //   0xea95a7...609353b2
        const initial = account.substring(0, 6);
        const end = account.substring(account.length - 6, account.length);
        const minimised = `${initial}...${end}`;
        return minimised;
    }
    // tslint:disable-next-line:prefer-function-over-method member-access
    render() {
        if (!this.props.account) {
            return <Content />;
        }
        return (
            <Content>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Blockie style={{ 'border-radius': '50%' }} seed={this.props.account} />
                </Field>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Label style={{ color: '#3636367d' }} isSize={'small'}>
                        {' '}
                        {this.minimisedAccount(this.props.account)}{' '}
                    </Label>
                </Field>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Label isSize={'small'}> {this.props.ethBalance} ETH</Label>
                </Field>
                <Field isMarginless={true} hasAddons={'centered'}>
                    <Label isSize={'small'}>
                        {' '}
                        {this.props.tokenBalance} {this.props.selectedToken}
                    </Label>
                </Field>
            </Content>
        );
    }
}

export { AccountBlockie, AccountBlockieProps };
