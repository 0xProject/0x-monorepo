import * as React from 'react';

export interface ListItemProps {
    bulletColor?: string;
}
export const ListItem: React.StatelessComponent<ListItemProps> = ({ bulletColor, children }) => {
    return (
        <div className="flex items-center">
            <svg className="flex-none lg-px2 md-px2 sm-pl2" height="26" width="26">
                <circle cx="13" cy="13" r="13" fill={bulletColor || 'transparent'} />
            </svg>
            <div className="flex-auto px2">{children}</div>
        </div>
    );
};
