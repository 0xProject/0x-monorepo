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
    maxWidth?: StringOrNum;
    children?: React.ReactNode;
}

export const Container: React.StatelessComponent<ContainerProps> = (props: ContainerProps) => {
    const { children, ...style } = props;
    return <div style={style}>{children}</div>;
};

Container.displayName = 'Container';
