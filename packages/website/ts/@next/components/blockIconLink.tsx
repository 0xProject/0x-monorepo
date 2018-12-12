import * as React from 'react';
import styled from 'styled-components';

import {Link} from 'ts/@next/components/button';
import {Icon} from 'ts/@next/components/icon';

interface Props {
    icon: string;
    title: string;
    linkLabel: string;
    linkUrl: string;
}

export const BlockIconLink = (props: Props) => (
    <Wrap>
        <div>
            <Icon
                name={props.icon}
                size="large"
                margin={[0, 0, 'default', 0]}
            />
        </div>
    </Wrap>
);

const Wrap = styled.div`
    padding: 40px;
    display: flex;
    align-items: center;
    text-align: center;
    background-color: ${props => props.theme.lightBgColor};
`;
