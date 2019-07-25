import React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

import { Link } from '@0x/react-shared';

import { colors } from 'ts/style/colors';

interface IShortcutLinksProps {
    links: IShortcutLinkProps[];
}
export interface IShortcutLinkProps {
    heading: string;
    icon: string;
    description?: string;
    url: string;
}

export const ShortcutLinks: React.FC<IShortcutLinksProps> = ({ links }) => (
    <ShortcutsWrapper>
        {links.map((link, index) => (
            <ShortcutLink key={`shortcutLink-${index}`} {...link} />
        ))}
    </ShortcutsWrapper>
);

export const ShortcutLink: React.FC<IShortcutLinkProps> = props => (
    <ShortcutLinkWrapper to={props.url}>
        <ShortcutIcon color={colors.brandLight} name={props.icon} />
        <div>
            <Heading size="small" marginBottom="8px">
                {props.heading}
            </Heading>
            <Paragraph size="default" marginBottom="0">
                {props.description}
            </Paragraph>
        </div>
    </ShortcutLinkWrapper>
);

const ShortcutsWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 30px;
    grid-row-gap: 30px;

    @media (max-width: 500px) {
        grid-template-columns: 1fr;
    }
`;

const ShortcutIcon = styled(Icon)`
    margin-bottom: 1rem;

    @media (min-width: 900px) {
        margin-right: 40px;
        margin-bottom: 0;
    }
`;

const ShortcutLinkWrapper = styled(Link)`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 50px;
    display: flex;
    align-items: center;
    flex-direction: column;
    text-align: center;

    @media (min-width: 900px) {
        flex-direction: row;
        text-align: left;
    }
`;
