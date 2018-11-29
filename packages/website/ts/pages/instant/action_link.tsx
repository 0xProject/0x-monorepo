import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { utils } from 'ts/utils/utils';

export interface ActionLinkProps {
    displayText: string;
    linkSrc?: string;
    onClick?: () => void;
    fontSize?: number;
    color?: string;
    className?: string;
}

export class ActionLink extends React.Component<ActionLinkProps> {
    public static defaultProps = {
        fontSize: 16,
        color: colors.white,
    };
    public render(): React.ReactNode {
        const { displayText, fontSize, color, className } = this.props;
        return (
            <Container
                className={`flex items-center ${className}`}
                marginRight="32px"
                onClick={this._handleClick}
                cursor="pointer"
            >
                <Container>
                    <Text fontSize="16px" fontColor={color}>
                        {displayText}
                    </Text>
                </Container>
                <Container paddingTop="1px" paddingLeft="6px">
                    <i className="zmdi zmdi-chevron-right bold" style={{ fontSize, color }} />
                </Container>
            </Container>
        );
    }

    private _handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (!_.isUndefined(this.props.onClick)) {
            this.props.onClick();
        } else if (!_.isUndefined(this.props.linkSrc)) {
            utils.openUrl(this.props.linkSrc);
        }
    };
}
