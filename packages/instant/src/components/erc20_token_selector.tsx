import * as _ from 'lodash';
import * as React from 'react';

import { ERC20Asset } from '../types';

import { Button, Container } from './ui';

export interface ERC20TokenSelectorProps {
    tokens: ERC20Asset[];
    onTokenSelect: (token: ERC20Asset) => void;
}

export const ERC20TokenSelector: React.StatelessComponent<ERC20TokenSelectorProps> = ({ tokens, onTokenSelect }) => (
    <Container>
        {_.map(tokens, token => <TokenSelectorRow key={token.assetData} token={token} onClick={onTokenSelect} />)}
    </Container>
);

interface TokenSelectorRowProps {
    token: ERC20Asset;
    onClick: (token: ERC20Asset) => void;
}

class TokenSelectorRow extends React.Component<TokenSelectorRowProps> {
    public render(): React.ReactNode {
        const { token } = this.props;
        return (
            <Container>
                <Button onClick={this._handleClick}>Select {token.metaData.symbol}</Button>
            </Container>
        );
    }
    private readonly _handleClick = (): void => {
        this.props.onClick(this.props.token);
    };
}
