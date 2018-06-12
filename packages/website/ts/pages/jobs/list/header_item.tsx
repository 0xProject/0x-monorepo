import * as React from 'react';

import { ListItem } from 'ts/pages/jobs/list/list_item';

export interface HeaderItemProps {
    headerText?: string;
}
export const HeaderItem: React.StatelessComponent<HeaderItemProps> = ({ headerText }) => {
    return (
        <div className="h2 lg-py4 md-py4 sm-py3">
            <ListItem>
                <div
                    style={{
                        fontFamily: 'Roboto Mono',
                        minHeight: '1.25em',
                        lineHeight: 1.25,
                    }}
                >
                    {headerText}
                </div>
            </ListItem>
        </div>
    );
};
