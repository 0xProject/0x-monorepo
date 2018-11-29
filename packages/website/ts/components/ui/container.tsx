import { TextAlignProperty } from 'csstype';
import { darken } from 'polished';
import * as React from 'react';

import { styled } from 'ts/style/theme';

type StringOrNum = string | number;

export type ContainerTag = 'div' | 'span';

export interface ContainerProps {
    marginTop?: StringOrNum;
    marginBottom?: StringOrNum;
    marginRight?: StringOrNum;
    marginLeft?: StringOrNum;
    padding?: StringOrNum;
    paddingTop?: StringOrNum;
    paddingBottom?: StringOrNum;
    paddingRight?: StringOrNum;
    paddingLeft?: StringOrNum;
    backgroundColor?: string;
    background?: string;
    border?: string;
    borderTop?: string;
    borderRadius?: StringOrNum;
    borderBottomLeftRadius?: StringOrNum;
    borderBottomRightRadius?: StringOrNum;
    borderBottom?: StringOrNum;
    borderColor?: string;
    maxWidth?: StringOrNum;
    maxHeight?: StringOrNum;
    width?: StringOrNum;
    height?: StringOrNum;
    minWidth?: StringOrNum;
    minHeight?: StringOrNum;
    textAlign?: TextAlignProperty;
    isHidden?: boolean;
    className?: string;
    position?: 'absolute' | 'fixed' | 'relative' | 'unset';
    display?: 'inline-block' | 'block' | 'inline-flex' | 'inline';
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    zIndex?: number;
    Tag?: ContainerTag;
    cursor?: string;
    id?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    overflowX?: 'scroll' | 'hidden' | 'auto' | 'visible';
    shouldDarkenOnHover?: boolean;
    shouldAddBoxShadowOnHover?: boolean;
}

export const PlainContainer: React.StatelessComponent<ContainerProps> = props => {
    const {
        children,
        className,
        Tag,
        isHidden,
        id,
        onClick,
        shouldDarkenOnHover,
        shouldAddBoxShadowOnHover,
        // tslint:disable-next-line:trailing-comma
        ...style
    } = props;
    const visibility = isHidden ? 'hidden' : undefined;
    return (
        <Tag id={id} style={{ ...style, visibility }} className={className} onClick={onClick}>
            {children}
        </Tag>
    );
};

export const Container = styled(PlainContainer)`
    &:hover {
        ${props =>
            props.shouldDarkenOnHover
                ? `background-color: ${props.backgroundColor ? darken(0.05, props.backgroundColor) : 'none'} !important`
                : ''};
        ${props => (props.shouldAddBoxShadowOnHover ? 'box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1)' : '')};
    }
`;

Container.defaultProps = {
    Tag: 'div',
};

Container.displayName = 'Container';
