import * as _ from 'lodash';
import * as React from 'react';
import {Token} from 'ts/types';
import {Identicon} from 'ts/components/ui/identicon';

interface TokenIconProps {
    token: Token;
    diameter: number;
}

interface TokenIconState {}

export class TokenIcon extends React.Component<TokenIconProps, TokenIconState> {
    public render() {
        const token = this.props.token;
        const diameter = this.props.diameter;
        return (
            <div>
                {(token.isRegistered && !_.isUndefined(token.iconUrl)) ?
                    <img
                        style={{width: diameter, height: diameter}}
                        src={token.iconUrl}
                    /> :
                    <Identicon address={token.address} diameter={diameter} />
                }
            </div>
        );
    }
}
