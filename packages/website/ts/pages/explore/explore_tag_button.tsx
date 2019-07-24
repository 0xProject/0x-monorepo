import * as React from 'react';
import styled from 'styled-components';

import { IThemeInterface } from 'ts/style/theme';

import { colors } from 'ts/style/colors';

export interface ButtonInterface {
    isDisabled?: boolean;
    disableHover?: boolean;
    className?: string;
    active?: boolean;
    children?: React.ReactNode | string;
    hasIcon?: boolean | string;
    padding?: string;
    onClick?: (e: any) => any;
    theme?: IThemeInterface;
}

export const ExploreTagButton: React.StatelessComponent<ButtonInterface> = (props: ButtonInterface) => {
    const { children, isDisabled, className } = props;

    const buttonProps = { disabled: isDisabled };

    return (
        <ButtonBase className={className} {...buttonProps} {...props}>
            {children}
        </ButtonBase>
    );
};

ExploreTagButton.defaultProps = {};

const ButtonBase = styled.button<ButtonInterface>`
    appearance: none;
    border: 1px solid transparent;
    display: inline-block;
    background-color: ${props => (props.active ? colors.brandLight : 'transparent')};
    border-color: ${props => (props.active ? colors.brandLight : colors.grey)};
    color: ${props => (props.active ? colors.white : colors.grey)};
    padding: 12px 18px;
    padding: ${props => !!props.padding && props.padding};
    text-align: center;
    font-size: 18px;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    transition: background-color 0.35s, border-color 0.35s, color 0.35s;

    &:hover {
        border-color: ${props => (props.disableHover ? colors.grey : colors.brandLight)};
        color: ${props => (props.disableHover ? colors.grey : props.active ? colors.white : colors.brandLight)};
    }
`;
