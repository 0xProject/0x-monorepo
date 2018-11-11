import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption, completelyTransparent } from '../../style/theme';
import { zIndex } from '../../style/z_index';

import { Container } from './container';
import { Flex } from './flex';
import { Icon } from './icon';
import { Overlay } from './overlay';
import { Text } from './text';

export interface DropdownItemConfig {
    text: string;
    onClick?: () => void;
}

export interface DropdownProps {
    value: string;
    label?: string;
    items: DropdownItemConfig[];
}

export interface DropdownState {
    isOpen: boolean;
}

export class Dropdown extends React.Component<DropdownProps, DropdownState> {
    public static defaultProps = {
        items: [],
    };
    public state: DropdownState = {
        isOpen: false,
    };
    public render(): React.ReactNode {
        const { value, label, items } = this.props;
        const { isOpen } = this.state;
        const hasItems = !_.isEmpty(items);
        const borderRadius = isOpen ? '4px 4px 0px 0px' : '4px';
        return (
            <React.Fragment>
                {isOpen && (
                    <Overlay
                        zIndex={zIndex.dropdownItems - 1}
                        backgroundColor={completelyTransparent}
                        onClick={this._closeDropdown}
                    />
                )}
                <Container position="relative">
                    <Container
                        cursor={hasItems ? 'pointer' : undefined}
                        onClick={this._handleDropdownClick}
                        hasBoxShadow={isOpen}
                        boxShadowOnHover={true}
                        borderRadius={borderRadius}
                        border="1px solid"
                        borderColor={ColorOption.feintGrey}
                        padding="0.8em"
                    >
                        <Flex justify="space-between">
                            <Text fontSize="16px" fontColor={ColorOption.darkGrey}>
                                {value}
                            </Text>
                            <Container>
                                {label && (
                                    <Text fontSize="16px" fontColor={ColorOption.lightGrey}>
                                        {label}
                                    </Text>
                                )}
                                {hasItems && (
                                    <Container marginLeft="5px" display="inline-block" position="relative" bottom="2px">
                                        <Icon padding="3px" icon="chevron" width={12} stroke={ColorOption.grey} />
                                    </Container>
                                )}
                            </Container>
                        </Flex>
                    </Container>
                    {isOpen && (
                        <Container
                            width="100%"
                            position="absolute"
                            onClick={this._closeDropdown}
                            backgroundColor={ColorOption.white}
                            hasBoxShadow={true}
                            zIndex={zIndex.dropdownItems}
                        >
                            {_.map(items, (item, index) => (
                                <DropdownItem key={item.text} {...item} isLast={index === items.length - 1} />
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
        this.setState({
            isOpen: !this.state.isOpen,
        });
    };
    private readonly _closeDropdown = (): void => {
        this.setState({
            isOpen: false,
        });
    };
}

export interface DropdownItemProps extends DropdownItemConfig {
    text: string;
    onClick?: () => void;
    isLast: boolean;
}

export const DropdownItem: React.StatelessComponent<DropdownItemProps> = ({ text, onClick, isLast }) => (
    <Container
        onClick={onClick}
        cursor="pointer"
        darkenOnHover={true}
        backgroundColor={ColorOption.white}
        padding="0.8em"
        borderTop="0"
        border="1px solid"
        borderRadius={isLast ? '0px 0px 4px 4px' : undefined}
        width="100%"
        borderColor={ColorOption.feintGrey}
    >
        <Text fontSize="14px" fontColor={ColorOption.darkGrey}>
            {text}
        </Text>
    </Container>
);
