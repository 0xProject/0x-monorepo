import { Event, EventArg } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import { AnchorTitle } from 'ts/components/documentation/shared/anchor_title';
import { HeaderSizes } from 'ts/types';
import { colors } from 'ts/utils/colors';

import { DocsInfo } from 'ts/utils/docs_info';

import { Type } from './type';

export interface EventDefinitionProps {
    event: Event;
    sectionName: string;
    docsInfo: DocsInfo;
}

export interface EventDefinitionState {
    shouldShowAnchor: boolean;
}

export class EventDefinition extends React.Component<EventDefinitionProps, EventDefinitionState> {
    constructor(props: EventDefinitionProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render(): React.ReactNode {
        const event = this.props.event;
        const id = `${this.props.sectionName}-${event.name}`;
        return (
            <div
                id={id}
                className="pb2"
                style={{ overflow: 'hidden', width: '100%' }}
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <AnchorTitle
                    headerSize={HeaderSizes.H3}
                    title={`Event ${event.name}`}
                    id={id}
                    shouldShowAnchor={this.state.shouldShowAnchor}
                />
                <div style={{ fontSize: 16 }}>
                    <pre>
                        <code className="hljs solidity">{this._renderEventCode()}</code>
                    </pre>
                </div>
            </div>
        );
    }
    private _renderEventCode(): React.ReactNode {
        const indexed = <span style={{ color: colors.green }}> indexed</span>;
        const eventArgs = _.map(this.props.event.eventArgs, (eventArg: EventArg) => {
            const type = (
                <Type
                    type={eventArg.type}
                    sectionName={this.props.sectionName}
                    docsInfo={this.props.docsInfo}
                    isInPopover={false}
                />
            );
            return (
                <span key={`eventArg-${eventArg.name}`}>
                    {eventArg.name}
                    {eventArg.isIndexed ? indexed : ''}: {type},
                </span>
            );
        });
        const argList = _.reduce(eventArgs, (prev: React.ReactNode, curr: React.ReactNode) => {
            return [prev, '\n\t', curr];
        });
        return (
            <span>
                {`{`}
                <br />
                {'\t'}
                {argList}
                <br />
                {`}`}
            </span>
        );
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean): void {
        this.setState({
            shouldShowAnchor,
        });
    }
}
