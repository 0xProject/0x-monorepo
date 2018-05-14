import { colors, EtherscanLinkSuffixes, Styles, utils as sharedUtils } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { TokenIcon } from 'ts/components/ui/token_icon';
import { WebsiteBackendTokenInfo } from 'ts/types';

export interface TopTokensProps {
    tokens: WebsiteBackendTokenInfo[];
    networkId: number;
}

const styles: Styles = {
    tokenLabel: {
        textDecoration: 'none',
        color: colors.mediumBlue,
    },
    followingTokenLabel: {
        paddingLeft: 16,
    },
};

export const TopTokens: React.StatelessComponent<TopTokensProps> = (props: TopTokensProps) => {
    return (
        <div className="flex">
            {_.map(props.tokens, (tokenInfo: WebsiteBackendTokenInfo, index: number) => {
                const firstItemStyle = { ...styles.tokenLabel, ...styles.followingTokenLabel };
                const style = index !== 0 ? firstItemStyle : styles.tokenLabel;
                return (
                    <a
                        key={tokenInfo.address}
                        href={tokenLinkFromToken(tokenInfo, props.networkId)}
                        target="_blank"
                        style={style}
                    >
                        {tokenInfo.symbol}
                    </a>
                );
            })}
        </div>
    );
};

function tokenLinkFromToken(tokenInfo: WebsiteBackendTokenInfo, networkId: number): string {
    return sharedUtils.getEtherScanLinkIfExists(tokenInfo.address, networkId, EtherscanLinkSuffixes.Address);
}
