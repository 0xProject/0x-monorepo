import * as React from 'react';

import { styled } from 'ts/style/theme';

export interface PlaceHolderProps {
    className?: string;
    hideChildren: React.ReactNode;
    fillColor: string;
}

const PlainPlaceHolder: React.StatelessComponent<PlaceHolderProps> = ({ className, hideChildren, children }) => {
    const childrenVisibility = hideChildren ? 'hidden' : 'visible';
    const childrenStyle: React.CSSProperties = { visibility: childrenVisibility };
    return (
        <div className={className}>
            <div style={childrenStyle}>{children}</div>
        </div>
    );
};

export const PlaceHolder = styled(PlainPlaceHolder)`
    background-color: ${props => (props.hideChildren ? props.fillColor : 'transparent')};
    display: inline-block;
    border-radius: 2px;
`;
