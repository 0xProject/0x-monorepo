import { History, Location } from 'history';
import * as React from 'react';
import { match, withRouter } from 'react-router-dom';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';

interface BaseComponentProps {
    icon?: string;
    iconComponent?: React.ReactNode;
    title: string;
    linkLabel: string;
    linkUrl?: string;
    linkAction?: () => void;
    history: History;
    location: Location;
    match: match<any>;
}

class BaseComponent extends React.PureComponent<BaseComponentProps> {
    public onClick = (): void => {
        const { linkAction, linkUrl } = this.props;

        if (linkAction) {
            linkAction();
        } else {
            this.props.history.push(linkUrl);
        }
    };

    public render(): React.ReactNode {
        const { icon, iconComponent, linkUrl, linkAction, title, linkLabel } = this.props;

        return (
            <Wrap onClick={this.onClick}>
                <div>
                    <Icon name={icon} component={iconComponent} size="large" margin={[0, 0, 'default', 0]} />

                    <Title>{title}</Title>

                    <Button isWithArrow={true} isTransparent={true} href={linkUrl} onClick={linkAction}>
                        {linkLabel}
                    </Button>
                </div>
            </Wrap>
        );
    }
}

export const BlockIconLink = withRouter(BaseComponent);

const Wrap = styled.div`
    width: calc(50% - 15px);
    height: 400px;
    padding: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    transition: background-color 0.25s;
    background-color: ${props => props.theme.lightBgColor};
    cursor: pointer;

    a,
    button {
        pointer-events: none;
    }

    @media (max-width: 900px) {
        width: 100%;
        margin-top: 30px;
    }

    &:hover {
        background-color: #002d28;
    }
`;

const Title = styled.h2`
    font-size: 20px;
    margin-bottom: 30px;
    color: ${props => props.theme.linkColor};
`;
