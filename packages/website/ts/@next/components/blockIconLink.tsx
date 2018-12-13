import * as React from 'react';
import styled from 'styled-components';

import {Button} from 'ts/@next/components/button';
import {Icon} from 'ts/@next/components/icon';

interface Props {
    icon: string;
    title: string;
    linkLabel: string;
    linkUrl: string;
    linkAction: () => void;
}

export const BlockIconLink = (props: Props) => (
    <Wrap>
        <div>
            <Icon
                name={props.icon}
                size="large"
                margin={[0, 0, 'default', 0]}
            />

            <Title>
                {props.title}
            </Title>

            <Button
                isWithArrow={true}
                isTransparent={true}
                href={props.linkUrl}
                onClick={props.linkAction}
            >
                {props.linkLabel}
            </Button>
        </div>
    </Wrap>
);

const Wrap = styled.div`
    width: calc(50% - 15px);
    height: 400px;
    padding: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    background-color: ${props => props.theme.lightBgColor};

    @media (max-width: 900px) {
        width: 100%;
        margin-top: 30px;
    }
`;

const Title = styled.h2`
    font-size: 20px;
    margin-bottom: 30px;
    color: ${props => props.theme.linkColor};
`;
