import * as React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { Heading, Paragraph } from 'ts/components/text';
import { WebsitePaths } from 'ts/types';

const navData = [
  {
      title: 'Asset Swapper',
      description: 'Funnel 0x liquidity into your DeFi smart contracts',
      url: WebsitePaths.AssetSwapperPage,
  },
    {
        title: '0x Instant',
        description: 'Embed simple token purchasing in any app or website',
        url: WebsitePaths.Instant,
    },
    {
        title: '0x Launch Kit',
        description: 'Launch an exchange or NFT marketplace in minutes',
        url: WebsitePaths.LaunchKit,
    },
    {
        title: 'Governance',
        description: 'Vote on ZEIPs to upgrade the 0x protocol',
        url: WebsitePaths.Vote,
    },
];

export const DropdownProducts: React.FC = () => (
    <List>
        {navData.map((item, index) => (
            <li key={`productLink-${index}`}>
                <Link to={item.url}>
                    <Heading asElement="h3" color="inherit" isNoMargin={true} size="small">
                        {item.title}
                    </Heading>

                    {item.description && (
                        <Paragraph color="inherit" isNoMargin={true} size="small" isMuted={0.5}>
                            {item.description}
                        </Paragraph>
                    )}
                </Link>
            </li>
        ))}
    </List>
);

const List = styled.ul`
    a {
        padding: 15px 30px;
        display: block;
        color: inherit;
    }
`;
