import * as _ from 'lodash';
import * as React from 'react';
import { colors } from 'ts/utils/colors';

import { Container } from './container';

export interface MultiSelectItemConfig {
    value: string;
    renderItemContent: (isSelected: boolean) => React.ReactNode;
    onClick?: () => void;
}

export interface MultiSelectProps {
    selectedValues?: string[];
    items: MultiSelectItemConfig[];
    backgroundColor?: string;
    height?: string;
}

export class MultiSelect extends React.Component<MultiSelectProps> {
    public static defaultProps = {
        backgroundColor: colors.white,
    };
    public render(): React.ReactNode {
        const { items, backgroundColor, selectedValues, height } = this.props;
        return (
            <Container
                backgroundColor={backgroundColor}
                borderRadius="4px"
                width="100%"
                height={height}
                overflowY="scroll"
            >
                {_.map(items, item => (
                    <MultiSelectItem
                        key={item.value}
                        renderItemContent={item.renderItemContent}
                        backgroundColor={backgroundColor}
                        onClick={item.onClick}
                        isSelected={selectedValues === undefined || _.includes(selectedValues, item.value)}
                    />
                ))}
            </Container>
        );
    }
}

export interface MultiSelectItemProps {
    renderItemContent: (isSelected: boolean) => React.ReactNode;
    isSelected?: boolean;
    onClick?: () => void;
    backgroundColor?: string;
}

export const MultiSelectItem: React.StatelessComponent<MultiSelectItemProps> = ({
    renderItemContent,
    isSelected,
    onClick,
    backgroundColor,
}) => (
    <Container cursor="pointer" shouldDarkenOnHover={true} onClick={onClick} backgroundColor={backgroundColor}>
        <Container borderBottom={`1px solid ${colors.lightestGrey}`} margin="0px 15px" padding="10px 0px">
            {renderItemContent(isSelected)}
        </Container>
    </Container>
);
