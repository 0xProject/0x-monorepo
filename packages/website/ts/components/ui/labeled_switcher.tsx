import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';

const CUSTOM_BLUE = '#63A6F1';

interface LabeledSwitcherProps {
    labelLeft: string;
    labelRight: string;
    isLeftInitiallySelected: boolean;
    onLeftLabelClickAsync: () => Promise<boolean>;
    onRightLabelClickAsync: () => Promise<boolean>;
}

interface LabeledSwitcherState {
    isLeftSelected: boolean;
}

export class LabeledSwitcher extends React.Component<LabeledSwitcherProps, LabeledSwitcherState> {
    constructor(props: LabeledSwitcherProps) {
        super(props);
        this.state = {
            isLeftSelected: props.isLeftInitiallySelected,
        };
    }
    public render() {
        const isLeft = true;
        return (
            <div
                className="rounded clearfix"
            >
                {this.renderLabel(this.props.labelLeft, isLeft, this.state.isLeftSelected)}
                {this.renderLabel(this.props.labelRight, !isLeft, !this.state.isLeftSelected)}
            </div>
        );
    }
    private renderLabel(title: string, isLeft: boolean, isSelected: boolean) {
        const borderStyle = `2px solid ${isSelected ? '#4F8BCF' : '#DADADA'}`;
        const style = {
            cursor: 'pointer',
            backgroundColor: isSelected ? CUSTOM_BLUE : colors.grey200,
            color: isSelected ? 'white' : '#A5A5A5',
            boxShadow: isSelected ? `inset 0px 0px 4px #4083CE` : 'inset 0px 0px 4px #F7F6F6',
            borderTop: borderStyle,
            borderBottom: borderStyle,
            [isLeft ? 'borderLeft' : 'borderRight']: borderStyle,
            paddingTop: 12,
            paddingBottom: 12,
        };
        return (
            <div
                className={`col col-6 center p1 ${isLeft ? 'rounded-left' : 'rounded-right'}`}
                style={style}
                onClick={this.onLabelClickAsync.bind(this, isLeft)}
            >
                {title}
            </div>
        );
    }
    private async onLabelClickAsync(isLeft: boolean): Promise<void> {
        this.setState({
            isLeftSelected: isLeft,
        });
        let didSucceed;
        if (isLeft) {
            didSucceed = await this.props.onLeftLabelClickAsync();
        } else {
            didSucceed = await this.props.onRightLabelClickAsync();
        }
        if (!didSucceed) {
            this.setState({
                isLeftSelected: !isLeft,
            });
        }
    }
}
