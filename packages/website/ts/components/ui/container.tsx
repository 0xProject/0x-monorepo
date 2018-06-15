import * as React from 'react';

type StringOrNum = string | number;

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
    width?: StringOrNum;
    isHidden?: boolean;
    className?: string;
    position?: 'absolute' | 'fixed' | 'relative' | 'unset';
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
}

export const Container: React.StatelessComponent<ContainerProps> = ({ children, className, isHidden, ...style }) => {
    const visibility = isHidden ? 'hidden' : undefined;
    return (
        <div style={{ ...style, visibility }} className={className}>
            {children}
        </div>
    );
};

Container.displayName = 'Container';
