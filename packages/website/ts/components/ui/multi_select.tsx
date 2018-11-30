import { colors } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { zIndex } from 'ts/style/z_index';

import { Container } from './container';
import { Overlay } from './overlay';
import { Text } from './text';

export interface MultiSelectItemConfig {
    value: string;
    displayText: string;
    onClick?: () => void;
}

export interface MultiSelectProps {
    selectedValues: string[];
    items: MultiSelectItemConfig[];
    backgroundColor?: string;
    textColor?: string;
}

export class MultiSelect extends React.Component<MultiSelectProps> {
    public static defaultProps = {
        backgroundColor: colors.white,
        textColor: colors.darkGrey,
    };
    public render(): React.ReactNode {
        const { items, backgroundColor } = this.props;
        return (
            <Container backgroundColor={backgroundColor} borderRadius="4px">
                {_.map(items, item => (
                    <MultiSelectItem key={item.value} displayText={item.displayText} onClick={item.onClick} />
                ))}
            </Container>
        );
    }
}

export interface MultiSelectItemProps {
    displayText: string;
    isSelected?: boolean;
    onClick?: () => void;
}

export const MultiSelectItem: React.StatelessComponent<MultiSelectItemProps> = ({
    displayText,
    isSelected,
    onClick,
}) => (
    <Container shouldDarkenOnHover={true} onClick={onClick}>
        <Container borderBottom="1px solid black" padding="0px 15px">
            {displayText}
        </Container>
    </Container>
);
