import * as React from 'react';

import { Circle } from 'ts/components/ui/circle';

export interface ListItemProps {
    bulletColor?: string;
}
export const ListItem: React.StatelessComponent<ListItemProps> = ({ bulletColor, children }) => {
    return (
        <div className="flex items-center">
            <Circle className="flex-none lg-px2 md-px2 sm-pl2" diameter={26} fillColor={bulletColor || 'transparent'} />
            <div className="flex-auto px2">{children}</div>
        </div>
    );
};
