import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Retry } from 'ts/components/ui/retry';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import { ScreenWidths, WebsiteBackendJobInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

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
        const isSmallScreen = utils.isMobileWidth(this.props.screenWidth);
        return (
            <Container id={this.props.hash} className="mx-auto pb4 px3 max-width-4">
                {!isSmallScreen && (
                    <hr style={{ border: 0, borderTop: 1, borderStyle: 'solid', borderColor: colors.beigeWhite }} />
                )}
                <Container marginTop="64px" marginBottom="50px">
                    <Text fontFamily="Roboto Mono" fontSize="24px" fontColor={colors.black}>
                        Open Positions
                    </Text>
                </Container>
                {isReadyToRender ? this._renderTable() : this._renderLoading()}
            </Container>
        );
    }
    private _renderLoading(): React.ReactNode {
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
    }
    private _renderTable(): React.ReactNode {
        return (
            <Container width="100%">
                <div>
                    {_.map(this.state.jobInfos, jobInfo => {
                        return (
                            <JobInfoTableRow
                                key={jobInfo.id}
                                screenWidth={this.props.screenWidth}
                                jobInfo={jobInfo}
                                onClick={this._openJobInfoUrl.bind(this, jobInfo)}
                            />
                        );
                    })}
                </div>
                <Container className="center" marginTop="70px">
                    <Text fontStyle="italic" fontSize="14px">
                        Interested in telling us why you'd be a valuable addition to the team outside of the positions
                        listed above?{' '}
                        <a
                            style={{ color: colors.mediumBlue, textDecoration: 'none' }}
                            href={`mailto:${constants.EMAIL_JOBS}`}
                        >
                            Email us!
                        </a>
                    </Text>
                </Container>
            </Container>
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
    private _openJobInfoUrl(jobInfo: WebsiteBackendJobInfo): void {
        const url = jobInfo.url;
        utils.openUrl(url);
    }
}

export interface JobInfoTableRowProps {
    className?: string;
    screenWidth: ScreenWidths;
    jobInfo: WebsiteBackendJobInfo;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const PlainJobInfoTableRow: React.StatelessComponent<JobInfoTableRowProps> = ({
    className,
    screenWidth,
    jobInfo,
    onClick,
}) => {
    const isSmallScreen = screenWidth === ScreenWidths.Sm;
    const titleClassName = isSmallScreen ? 'col col-12 center' : 'col col-5';
    const paddingLeft = isSmallScreen ? undefined : '30px';
    return (
        <Container className={className} onClick={onClick} marginBottom="30px" paddingLeft={paddingLeft}>
            <Container className="flex items-center" minHeight={TABLE_ROW_MIN_HEIGHT} width="100%">
                <Container className="clearfix container" width="100%">
                    <Container className={titleClassName}>
                        <Text fontSize="16px" fontWeight="bold" fontColor={colors.mediumBlue}>
                            {jobInfo.title}
                        </Text>
                    </Container>
                    {!isSmallScreen && (
                        <Container className="col col-3">
                            <Text fontSize="16px">{jobInfo.department}</Text>
                        </Container>
                    )}
                    {!isSmallScreen && (
                        <Container className="col col-4 center">
                            <Text fontSize="16px">{jobInfo.office}</Text>
                        </Container>
                    )}
                </Container>
            </Container>
        </Container>
    );
};

export const JobInfoTableRow = styled(PlainJobInfoTableRow)`
    cursor: pointer;
    background-color: ${colors.grey100};
    border-radius: 7px;
    &:hover {
        opacity: 0.5;
    }
`;
