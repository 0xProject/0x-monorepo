import * as _ from 'lodash';
import * as React from 'react';
import { colors } from 'ts/utils/colors';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { EtherscanLinkSuffixes, WebsiteBackendTokenInfo } from 'ts/types';
import { analytics } from 'ts/utils/analytics';
import { utils } from 'ts/utils/utils';

export interface TopTokensProps {
    tokens: WebsiteBackendTokenInfo[];
    networkId: number;
}

export const TopTokens: React.StatelessComponent<TopTokensProps> = (props: TopTokensProps) => {
    return (
        <div className="flex">
            {_.map(props.tokens, (tokenInfo: WebsiteBackendTokenInfo) => {
                return (
                    <Container key={tokenInfo.address} marginRight="16px">
                        <TokenLink tokenInfo={tokenInfo} networkId={props.networkId} />
                    </Container>
                );
            })}
        </div>
    );
};

interface TokenLinkProps {
    tokenInfo: WebsiteBackendTokenInfo;
    networkId: number;
}
interface TokenLinkState {}

class TokenLink extends React.Component<TokenLinkProps, TokenLinkState> {
    constructor(props: TokenLinkProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render(): React.ReactNode {
        const onClick = (event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            analytics.track('Token Click', {
                tokenSymbol: this.props.tokenInfo.symbol,
            });
            const tokenLink = this._tokenLinkFromToken(this.props.tokenInfo, this.props.networkId);
            utils.openUrl(tokenLink);
        };
        return (
            <Text fontSize="14px" fontColor={colors.mediumBlue} onClick={onClick}>
                {this.props.tokenInfo.symbol}
            </Text>
        );
    }
    private _tokenLinkFromToken(tokenInfo: WebsiteBackendTokenInfo, networkId: number): string {
        return utils.getEtherScanLinkIfExists(tokenInfo.address, networkId, EtherscanLinkSuffixes.Address);
    }
}
