import * as _ from 'lodash';
import * as React from 'react';
import {Card, CardHeader, CardText} from 'material-ui/Card';

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
    public render() {
        return (
            <div
                className="py1"
            >
                <Card
                    initiallyExpanded={this.props.shouldDisplayExpanded}
                    onExpandChange={this.onExchangeChange.bind(this)}
                >
                    <CardHeader
                        title={this.props.prompt}
                        style={{borderBottom: this.state.isExpanded ? '1px solid rgba(0, 0, 0, 0.19)' : 'none'}}
                        titleStyle={{color: 'rgb(66, 66, 66)'}}
                        actAsExpander={true}
                        showExpandableButton={true}
                    />
                    <CardText expandable={true}>
                        <div style={{lineHeight: 1.4}}>
                            {this.props.answer}
                        </div>
                    </CardText>
                </Card>
            </div>
        );
    }
    private onExchangeChange() {
        this.setState({
            isExpanded: !this.state.isExpanded,
        });
    }
}
