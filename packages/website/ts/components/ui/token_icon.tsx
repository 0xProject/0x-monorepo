import * as _ from 'lodash';
import * as React from 'react';
import { Identicon } from 'ts/components/ui/identicon';
import { Token } from 'ts/types';

interface TokenIconProps {
    token: Token;
    diameter: number;
}

interface TokenIconState {}

export class TokenIcon extends React.Component<TokenIconProps, TokenIconState> {
    public render(): React.ReactNode {
        const token = this.props.token;
        const diameter = this.props.diameter;
        return (
            <div>
                {token.isRegistered && !_.isUndefined(token.iconUrl) ? (
                    <img style={{ width: diameter, height: diameter }} src={token.iconUrl} />
                ) : (
                    <Identicon address={token.address} diameter={diameter} />
                )}
            </div>
        );
    }
}
