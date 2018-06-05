import { colors } from '@0xproject/react-shared';
import { darken } from 'polished';
import * as React from 'react';
import { styled } from 'ts/style/theme';

export interface ButtonProps {
    className?: string;
    fontSize?: string;
    fontColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    width?: string;
    type?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const PlainButton: React.StatelessComponent<ButtonProps> = ({ children, onClick, type, className }) => (
    <button type={type} className={className} onClick={onClick}>
        {children}
    </button>
);

export const Button = styled(PlainButton)`
    cursor: pointer;
    font-size: ${props => props.fontSize};
    color: ${props => props.fontColor};
    padding: 0.8em 2.2em;
    border-radius: 6px;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
    font-weight: 500;
    font-family: 'Roboto';
    width: ${props => props.width};
    background-color: ${props => props.backgroundColor};
    border: ${props => (props.borderColor ? `1px solid ${props.borderColor}` : 'none')};
    &:hover {
        background-color: ${props => darken(0.1, props.backgroundColor)};
    }
    &:active {
        background-color: ${props => darken(0.2, props.backgroundColor)};
    }
`;

Button.defaultProps = {
    fontSize: '12px',
    backgroundColor: colors.white,
    width: 'auto',
};

Button.displayName = 'Button';

type CallToActionType = 'light' | 'dark';

export interface CallToActionProps {
    type?: CallToActionType;
    fontSize?: string;
    width?: string;
}

export const CallToAction: React.StatelessComponent<CallToActionProps> = ({ children, type, fontSize, width }) => {
    const isLight = type === 'light';
    const backgroundColor = isLight ? colors.white : colors.heroGrey;
    const fontColor = isLight ? colors.heroGrey : colors.white;
    const borderColor = isLight ? undefined : colors.white;
    return (
        <Button
            fontSize={fontSize}
            backgroundColor={backgroundColor}
            fontColor={fontColor}
            width={width}
            borderColor={borderColor}
        >
            {children}
        </Button>
    );
};

CallToAction.defaultProps = {
    type: 'dark',
};
