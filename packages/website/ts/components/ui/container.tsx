import * as React from 'react';

type StringOrNum = string | number;

export type ContainerTag = 'div' | 'span';

export interface ContainerProps {
    marginTop?: StringOrNum;
    marginBottom?: StringOrNum;
    marginRight?: StringOrNum;
    marginLeft?: StringOrNum;
    paddingTop?: StringOrNum;
    paddingBottom?: StringOrNum;
    paddingRight?: StringOrNum;
    paddingLeft?: StringOrNum;
    backgroundColor?: string;
    borderRadius?: StringOrNum;
    maxWidth?: StringOrNum;
    maxHeight?: StringOrNum;
    width?: StringOrNum;
    height?: StringOrNum;
    minWidth?: StringOrNum;
    minHeight?: StringOrNum;
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
}

export const Container: React.StatelessComponent<ContainerProps> = props => {
    const { children, className, Tag, isHidden, ...style } = props;
    const visibility = isHidden ? 'hidden' : undefined;
    return (
        <Tag style={{ ...style, visibility }} className={className}>
            {children}
        </Tag>
    );
};

Container.defaultProps = {
    Tag: 'div',
};

Container.displayName = 'Container';
