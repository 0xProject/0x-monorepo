import * as _ from 'lodash';
import * as React from 'react';
import {Styles} from 'ts/types';

const styles: Styles = {
    badge: {
        width: 50,
        fontSize: 11,
        height: 10,
        borderRadius: 5,
        marginTop: 25,
        lineHeight: 0.9,
        fontFamily: 'Roboto Mono',
        marginLeft: 3,
        marginRight: 3,
    },
};

interface BadgeProps {
    title: string;
    backgroundColor: string;
}

interface BadgeState {
    isHovering: boolean;
}

export class Badge extends React.Component<BadgeProps, BadgeState> {
    constructor(props: BadgeProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render() {
        const badgeStyle = {
            ...styles.badge,
            backgroundColor: this.props.backgroundColor,
            opacity: this.state.isHovering ? 0.7 : 1,
        };
        return (
            <div
                className="p1 center"
                style={badgeStyle}
                onMouseOver={this.setHoverState.bind(this, true)}
                onMouseOut={this.setHoverState.bind(this, false)}
            >
                {this.props.title}
            </div>
        );
    }
    private setHoverState(isHovering: boolean) {
        this.setState({
            isHovering,
        });
    }
}
