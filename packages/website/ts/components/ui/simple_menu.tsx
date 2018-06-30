import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';

export interface SimpleMenuProps {}

export const SimpleMenu: React.StatelessComponent<SimpleMenuProps> = ({ children }) => {
    return (
        <Container
            marginLeft="16px"
            marginRight="16px"
            marginBottom="16px"
            minWidth="220px"
            className="flex flex-column"
        >
            {children}
        </Container>
    );
};

export interface SimpleMenuItemProps {
    text: string;
    onClick?: () => void;
}
export const SimpleMenuItem: React.StatelessComponent<SimpleMenuItemProps> = ({ text, onClick }) => (
    <Container marginTop="16px" minWidth="220px" className="flex flex-column">
        <Text fontSize="14px" fontColor={colors.darkGrey} onClick={onClick} hoverColor={colors.mediumBlue}>
            {text}
        </Text>
    </Container>
);
