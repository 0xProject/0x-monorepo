import * as _ from 'lodash';
import * as React from 'react';

import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Heading, Paragraph } from 'ts/components/text';
import { WebsitePaths } from 'ts/types';

const navData = [
    {
        title: '0x Instant',
        description: 'Simple crypto purchasing',
        url: WebsitePaths.Instant,
    },
    {
        title: '0x Launch Kit',
        description: 'Build on the 0x protocol',
        url: WebsitePaths.LaunchKit,
    },
    {
        title: 'Asset Swapper',
        description: 'Swap tokens via smart contracts',
        url: WebsitePaths.AssetSwapper,
    },
    {
        title: 'Governance',
        description: 'Vote on changes to the 0x protocol',
        url: WebsitePaths.Vote,
    },
];

export const DropdownProducts: React.FunctionComponent<{}> = () => (
    <List>
        {_.map(navData, (item, index) => (
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
