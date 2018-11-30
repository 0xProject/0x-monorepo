import { colors } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { zIndex } from 'ts/style/z_index';

import { Container } from './container';
import { Overlay } from './overlay';
import { Text } from './text';

export interface SelectItemConfig {
    text: string;
    onClick?: () => void;
}

export interface SelectProps {
    value: string;
    label?: string;
    items: SelectItemConfig[];
    onOpen?: () => void;
    border?: string;
    fontSize?: string;
    iconSize?: number;
    textColor?: string;
    labelColor?: string;
    backgroundColor?: string;
}

export interface SelectState {
    isOpen: boolean;
}

export class Select extends React.Component<SelectProps, SelectState> {
    public static defaultProps = {
        items: [] as SelectItemConfig[],
        textColor: colors.black,
        backgroundColor: colors.white,
        fontSize: '16px',
        iconSize: 25,
    };
    public state: SelectState = {
        isOpen: false,
    };
    public render(): React.ReactNode {
        const { value, label, items, border, textColor, labelColor, backgroundColor, fontSize, iconSize } = this.props;
        const { isOpen } = this.state;
        const hasItems = !_.isEmpty(items);
        const borderRadius = isOpen ? '4px 4px 0px 0px' : '4px';
        return (
            <React.Fragment>
                {isOpen && (
                    <Overlay
                        style={{
                            zIndex: zIndex.overlay,
                            backgroundColor: 'rgba(255, 255, 255, 0)',
                        }}
                        onClick={this._closeDropdown}
                    />
                )}
                <Container position="relative">
                    <Container
                        cursor={hasItems ? 'pointer' : undefined}
                        onClick={this._handleDropdownClick}
                        borderRadius={borderRadius}
                        hasBoxShadow={isOpen}
                        border={border}
                        backgroundColor={backgroundColor}
                        padding="0.8em"
                        width="100%"
                    >
                        <Container className="flex justify-between">
                            <Text fontSize={fontSize} fontColor={textColor}>
                                {value}
                            </Text>
                            <Container>
                                {label && (
                                    <Text fontSize={fontSize} fontColor={labelColor}>
                                        {label}
                                    </Text>
                                )}
                                {hasItems && (
                                    <Container marginLeft="5px" display="inline-block" position="relative" bottom="2px">
                                        <i
                                            className="zmdi zmdi-chevron-down"
                                            style={{ fontSize: iconSize, color: colors.darkGrey }}
                                        />
                                    </Container>
                                )}
                            </Container>
                        </Container>
                    </Container>
                    {isOpen && (
                        <Container
                            width="100%"
                            position="absolute"
                            onClick={this._closeDropdown}
                            zIndex={zIndex.aboveOverlay}
                            hasBoxShadow={true}
                        >
                            {_.map(items, (item, index) => (
                                <SelectItem
                                    key={item.text}
                                    {...item}
                                    isLast={index === items.length - 1}
                                    backgroundColor={backgroundColor}
                                    textColor={textColor}
                                    border={border}
                                />
                            ))}
                        </Container>
                    )}
                </Container>
            </React.Fragment>
        );
    }
    private readonly _handleDropdownClick = (): void => {
        if (_.isEmpty(this.props.items)) {
            return;
        }
        const isOpen = !this.state.isOpen;
        this.setState({
            isOpen,
        });

        if (isOpen && this.props.onOpen) {
            this.props.onOpen();
        }
    };
    private readonly _closeDropdown = (): void => {
        this.setState({
            isOpen: false,
        });
    };
}

export interface SelectItemProps extends SelectItemConfig {
    text: string;
    onClick?: () => void;
    isLast: boolean;
    backgroundColor?: string;
    border?: string;
    textColor?: string;
    fontSize?: string;
}

export const SelectItem: React.StatelessComponent<SelectItemProps> = ({
    text,
    onClick,
    isLast,
    border,
    backgroundColor,
    textColor,
    fontSize,
}) => (
    <Container
        onClick={onClick}
        cursor="pointer"
        backgroundColor={backgroundColor}
        padding="0.8em"
        borderTop="0"
        border={border}
        shouldDarkenOnHover={true}
        borderRadius={isLast ? '0px 0px 4px 4px' : undefined}
        width="100%"
    >
        <Text fontSize={fontSize} fontColor={textColor}>
            {text}
        </Text>
    </Container>
);
