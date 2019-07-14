import React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';
export interface IShortcutLinkProps {
    heading: string;
    icon: string;
    description?: string;
    url: string;
    shouldOpenInNewTab?: boolean;
    isHome?: boolean;
}

export const ShortcutLink: React.FC<IShortcutLinkProps> = props => (
    <ShortcutLinkWrapper isHome={props.isHome} href={props.url}>
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

ShortcutLink.defaultProps = {
    isHome: false,
};

const ShortcutIcon = styled(Icon)`
    margin-bottom: 1rem;

    @media (min-width: 900px) {
        margin-right: 40px;
        margin-bottom: 0;
    }
`;

const ShortcutLinkWrapper = styled.a<{ isHome: boolean }>`
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
