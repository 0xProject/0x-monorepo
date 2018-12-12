import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Text } from './ui/text';

export interface SectionHeaderProps {
    children?: React.ReactNode;
}
export const SectionHeader: React.StatelessComponent<{}> = props => {
    return (
        <Text
            letterSpacing="1px"
            fontColor={ColorOption.primaryColor}
            fontWeight={600}
            textTransform="uppercase"
            fontSize="12px"
        >
            {props.children}
        </Text>
    );
};
