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
        <Icon color={colors.brandLight} name={props.icon} size={80} margin={[0, 40, 0, 0]} />
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

const ShortcutLinkWrapper = styled.a<{ isHome: boolean }>`
    background-color: ${colors.backgroundLight};
    border: 1px solid #dbdfdd;
    padding: 50px;
    display: flex;
    align-items: center;
`;
