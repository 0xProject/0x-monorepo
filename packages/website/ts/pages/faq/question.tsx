import { colors } from '@0x/react-shared';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import * as React from 'react';

export interface QuestionProps {
    prompt: string;
    answer: React.ReactNode;
    shouldDisplayExpanded: boolean;
}

interface QuestionState {
    isExpanded: boolean;
}

export class Question extends React.Component<QuestionProps, QuestionState> {
    constructor(props: QuestionProps) {
        super(props);
        this.state = {
            isExpanded: props.shouldDisplayExpanded,
        };
    }
    public render(): React.ReactNode {
        return (
            <div className="py1">
                <Card
                    initiallyExpanded={this.props.shouldDisplayExpanded}
                    onExpandChange={this._onExchangeChange.bind(this)}
                >
                    <CardHeader
                        title={this.props.prompt}
                        style={{
                            borderBottom: this.state.isExpanded ? '1px solid rgba(0, 0, 0, 0.19)' : 'none',
                        }}
                        titleStyle={{ color: colors.darkerGrey }}
                        actAsExpander={true}
                        showExpandableButton={true}
                    />
                    <CardText expandable={true}>
                        <div style={{ lineHeight: 1.4 }}>{this.props.answer}</div>
                    </CardText>
                </Card>
            </div>
        );
    }
    private _onExchangeChange(): void {
        this.setState({
            isExpanded: !this.state.isExpanded,
        });
    }
}
