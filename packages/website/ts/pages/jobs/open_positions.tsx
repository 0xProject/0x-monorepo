import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import * as React from 'react';

import { Retry } from 'ts/components/ui/retry';
import { colors } from 'ts/style/colors';
import { WebsiteBackendJobInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';

const labelStyle = { fontFamily: 'Roboto Mono', fontSize: 18 };

export interface OpenPositionsProps {
    hash: string;
}
export interface OpenPositionsState {
    jobInfos?: WebsiteBackendJobInfo[];
    error?: Error;
}

export class OpenPositions extends React.Component<OpenPositionsProps, OpenPositionsState> {
    private _isUnmounted: boolean;
    constructor(props: OpenPositionsProps) {
        super(props);
        this._isUnmounted = false;
        this.state = {
            jobInfos: undefined,
            error: undefined,
        };
    }
    public componentWillMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._fetchJobInfosAsync();
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public render(): React.ReactNode {
        const isReadyToRender = _.isUndefined(this.state.error) && !_.isUndefined(this.state.jobInfos);
        if (!isReadyToRender) {
            return (
                // TODO: consolidate this loading component with the one in portal and RelayerIndex
                // TODO: possibly refactor into a generic loading container with spinner and retry UI
                <div className="center">
                    {_.isUndefined(this.state.error) ? (
                        <CircularProgress size={40} thickness={5} />
                    ) : (
                        <Retry onRetry={this._fetchJobInfosAsync.bind(this)} />
                    )}
                </div>
            );
        } else {
            return (
                <div id={this.props.hash} className="mx-auto max-width-4">
                    <Title />
                    <Table selectable={false} onCellClick={this._onCellClick.bind(this)}>
                        <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                            <TableRow>
                                <TableHeaderColumn colSpan={5} style={labelStyle}>
                                    Position
                                </TableHeaderColumn>
                                <TableHeaderColumn colSpan={3} style={labelStyle}>
                                    Department
                                </TableHeaderColumn>
                                <TableHeaderColumn colSpan={4} style={labelStyle}>
                                    Office
                                </TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody displayRowCheckbox={false} showRowHover={true}>
                            {_.map(this.state.jobInfos, jobInfo => {
                                return this._renderJobInfo(jobInfo);
                            })}
                        </TableBody>
                    </Table>
                </div>
            );
        }
    }
    private _renderJobInfo(jobInfo: WebsiteBackendJobInfo): React.ReactNode {
        return (
            <TableRow key={jobInfo.id} hoverable={true} displayBorder={false} style={{ height: 100, border: 2 }}>
                <TableRowColumn colSpan={5} style={labelStyle}>
                    {jobInfo.title}
                </TableRowColumn>
                <TableRowColumn colSpan={3} style={labelStyle}>
                    {jobInfo.department}
                </TableRowColumn>
                <TableRowColumn colSpan={4} style={labelStyle}>
                    {jobInfo.office}
                </TableRowColumn>
            </TableRow>
        );
    }
    private async _fetchJobInfosAsync(): Promise<void> {
        try {
            if (!this._isUnmounted) {
                this.setState({
                    jobInfos: undefined,
                    error: undefined,
                });
            }
            const jobInfos = await backendClient.getJobInfosAsync();
            if (!this._isUnmounted) {
                this.setState({
                    jobInfos,
                });
            }
        } catch (error) {
            if (!this._isUnmounted) {
                this.setState({
                    error,
                });
            }
        }
    }
    private _onCellClick(rowNumber: number): void {
        if (_.isUndefined(this.state.jobInfos)) {
            return;
        }
        const url = this.state.jobInfos[rowNumber].url;
        window.open(url, '_blank');
    }
}

const Title = () => (
    <div
        className="h2 lg-py4 md-py4 sm-py3"
        style={{
            paddingLeft: 90,
            fontFamily: 'Roboto Mono',
        }}
    >
        {'Open Positions'}
    </div>
);
