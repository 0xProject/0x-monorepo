import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import * as React from 'react';

import { Retry } from 'ts/components/ui/retry';
import { Text } from 'ts/components/ui/text';
import { HeaderItem } from 'ts/pages/jobs/list/header_item';
import { ListItem } from 'ts/pages/jobs/list/list_item';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import { ScreenWidths, WebsiteBackendJobInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';

const labelStyle = { fontFamily: 'Roboto Mono', fontSize: 18 };
const HEADER_TEXT = 'Open Positions';
const TABLE_ROW_MIN_HEIGHT = 100;

export interface OpenPositionsProps {
    hash: string;
    screenWidth: ScreenWidths;
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
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
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
                    {isSmallScreen ? this._renderList() : this._renderTable()}
                </div>
            );
        }
    }
    private _renderList(): React.ReactNode {
        return (
            <div style={{ backgroundColor: colors.jobsPageBackground }}>
                <HeaderItem headerText={HEADER_TEXT} />
                {_.map(this.state.jobInfos, jobInfo => (
                    <JobInfoListItem
                        key={jobInfo.id}
                        title={jobInfo.title}
                        description={jobInfo.department}
                        onClick={this._openJobInfoUrl.bind(this, jobInfo)}
                    />
                ))}
            </div>
        );
    }
    private _renderTable(): React.ReactNode {
        return (
            <div>
                <HeaderItem headerText={HEADER_TEXT} />
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
                            return this._renderJobInfoTableRow(jobInfo);
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    }
    private _renderJobInfoTableRow(jobInfo: WebsiteBackendJobInfo): React.ReactNode {
        return (
            <TableRow
                key={jobInfo.id}
                hoverable={true}
                displayBorder={false}
                style={{ height: TABLE_ROW_MIN_HEIGHT, border: 2 }}
            >
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
        const jobInfo = this.state.jobInfos[rowNumber];
        this._openJobInfoUrl(jobInfo);
    }

    private _openJobInfoUrl(jobInfo: WebsiteBackendJobInfo): void {
        const url = jobInfo.url;
        window.open(url, '_blank');
    }
}

export interface JobInfoListItemProps {
    title?: string;
    description?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const PlainJobInfoListItem: React.StatelessComponent<JobInfoListItemProps> = ({ title, description, onClick }) => (
    <div className="mb3" onClick={onClick}>
        <ListItem>
            <Text fontWeight="bold" fontSize="16px" fontColor={colors.mediumBlue}>
                {title + ' ›'}
            </Text>
            <Text className="pt1" fontSize="16px" fontColor={colors.darkGrey}>
                {description}
            </Text>
        </ListItem>
    </div>
);

export const JobInfoListItem = styled(PlainJobInfoListItem)`
    cursor: pointer;
    &:hover {
        opacity: 0.5;
    }
`;
