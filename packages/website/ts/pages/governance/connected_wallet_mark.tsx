import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface ConnectedWalletMarkProps {
    isConnected: boolean;
    providerName?: string;
}

export const ConnectedWalletMark: React.StatelessComponent<ConnectedWalletMarkProps> = ({ isConnected, providerName }) => {
    const typeLabel = isConnected ? providerName || 'Wallet connected' : 'Connect your wallet';

    const Label = styled.span`
        font-size: 12px;
    `;

    return (
        <Wrapper>
            <Status isConnected={isConnected} />
            <Label>{typeLabel}</Label>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    justify-content: flex-end;
`;
const Status = styled.span<ConnectedWalletMarkProps>`
    background: ${props => props.isConnected ? colors.brandLight : '#FF2828'};
    border-radius: 50%;
    width: 8px;
    height: 8px;
    display: inline-block;
    margin-right: 5px;
`;