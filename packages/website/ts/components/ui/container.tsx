import * as React from 'react';

export interface ContainerProps {
    marginTop?: string | number;
    marginBottom?: string | number;
    marginRight?: string | number;
    marginLeft?: string | number;
    children?: React.ReactNode;
}

export const Container: React.StatelessComponent<ContainerProps> = (props: ContainerProps) => {
    const { children, ...style } = props;
    return <div style={style}>{children}</div>;
};

Container.displayName = 'Container';
