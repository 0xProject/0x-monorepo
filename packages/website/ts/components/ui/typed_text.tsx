import * as _ from 'lodash';
import * as React from 'react';
import Typist from 'react-typist';

import { Text, TextProps } from 'ts/components/ui/text';

import 'react-typist/dist/Typist.css';

export interface TypedTextProps extends TextProps {
    textList: string[];
    shouldRepeat?: boolean;
    wordDelayMs?: number;
    avgKeystrokeDelayMs?: number;
    stdKeystrokeDelay?: number;
}

export interface TypedTextState {
    cycleCount: number;
}

export class TypedText extends React.Component<TypedTextProps, TypedTextState> {
    public static defaultProps = {
        shouldRepeat: false,
        avgKeystrokeDelayMs: 90,
        wordDelayMs: 1000,
    };
    public state = {
        cycleCount: 0,
    };
    public render(): React.ReactNode {
        const {
            textList,
            shouldRepeat,
            wordDelayMs,
            avgKeystrokeDelayMs,
            stdKeystrokeDelay,
            // tslint:disable-next-line
            ...textProps
        } = this.props;
        const { cycleCount } = this.state;
        if (_.isEmpty(textList)) {
            return null;
        }
        const typistChildren: React.ReactNode[] = [];
        _.forEach(textList, text => {
            typistChildren.push(
                <Text key={`text-${text}-${cycleCount}`} {...textProps}>
                    {text}
                </Text>,
            );
            if (wordDelayMs) {
                typistChildren.push(<Typist.Delay key={`delay-${text}-${cycleCount}`} ms={wordDelayMs} />);
            }
            typistChildren.push(<Typist.Backspace key={`backspace-${text}-${cycleCount}`} count={text.length} />);
        });
        return (
            <Typist
                avgTypingDelay={avgKeystrokeDelayMs}
                stdTypingDelay={stdKeystrokeDelay}
                className="inline"
                key={`typist-key-${cycleCount}`}
                onTypingDone={this._onTypingDone.bind(this)}
            >
                {typistChildren}
            </Typist>
        );
    }
    private _onTypingDone(): void {
        if (this.props.shouldRepeat) {
            this.setState({
                cycleCount: this.state.cycleCount + 1,
            });
        }
    }
}
