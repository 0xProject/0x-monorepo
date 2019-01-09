import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Text } from './ui/text';

export interface SectionHeaderProps {}
export const SectionHeader: React.StatelessComponent<SectionHeaderProps> = props => {
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
SectionHeader.displayName = 'SectionHeader';
