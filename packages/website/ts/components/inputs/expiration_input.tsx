import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
import * as moment from 'moment';
import * as React from 'react';
import { utils } from 'ts/utils/utils';

interface ExpirationInputProps {
    orderExpiryTimestamp: BigNumber;
    updateOrderExpiry: (unixTimestampSec: BigNumber) => void;
}

interface ExpirationInputState {
    dateMoment: moment.Moment;
    timeMoment: moment.Moment;
}

export class ExpirationInput extends React.Component<ExpirationInputProps, ExpirationInputState> {
    private readonly _earliestPickableMoment: moment.Moment;
    constructor(props: ExpirationInputProps) {
        super(props);
        // Set the earliest pickable date to today at 00:00, so users can only pick the current or later dates
        this._earliestPickableMoment = moment().startOf('day');
        const expirationMoment = utils.convertToMomentFromUnixTimestamp(props.orderExpiryTimestamp);
        const initialOrderExpiryTimestamp = utils.initialOrderExpiryUnixTimestampSec();
        const didUserSetExpiry = !initialOrderExpiryTimestamp.eq(props.orderExpiryTimestamp);
        this.state = {
            dateMoment: didUserSetExpiry ? expirationMoment : undefined,
            timeMoment: didUserSetExpiry ? expirationMoment : undefined,
        };
    }
    public render(): React.ReactNode {
        const date = this.state.dateMoment ? this.state.dateMoment.toDate() : undefined;
        const time = this.state.timeMoment ? this.state.timeMoment.toDate() : undefined;
        return (
            <div className="clearfix">
                <div className="col col-6 overflow-hidden pr3 flex relative">
                    <DatePicker
                        className="overflow-hidden"
                        hintText="Date"
                        mode="landscape"
                        autoOk={true}
                        value={date}
                        onChange={this._onDateChanged.bind(this)}
                        shouldDisableDate={this._shouldDisableDate.bind(this)}
                    />
                    <div className="absolute" style={{ fontSize: 20, right: 40, top: 13, pointerEvents: 'none' }}>
                        <i className="zmdi zmdi-calendar" />
                    </div>
                </div>
                <div className="col col-5 overflow-hidden flex relative">
                    <TimePicker
                        className="overflow-hidden"
                        hintText="Time"
                        autoOk={true}
                        value={time}
                        onChange={this._onTimeChanged.bind(this)}
                    />
                    <div className="absolute" style={{ fontSize: 20, right: 9, top: 13, pointerEvents: 'none' }}>
                        <i className="zmdi zmdi-time" />
                    </div>
                </div>
                <div onClick={this._clearDates.bind(this)} className="col col-1 pt2" style={{ textAlign: 'right' }}>
                    <i style={{ fontSize: 16, cursor: 'pointer' }} className="zmdi zmdi-close" />
                </div>
            </div>
        );
    }
    private _shouldDisableDate(date: Date): boolean {
        return moment(date)
            .startOf('day')
            .isBefore(this._earliestPickableMoment);
    }
    private _clearDates(): void {
        this.setState({
            dateMoment: undefined,
            timeMoment: undefined,
        });
        const defaultDateTime = utils.initialOrderExpiryUnixTimestampSec();
        this.props.updateOrderExpiry(defaultDateTime);
    }
    private _onDateChanged(_event: any, date: Date): void {
        const dateMoment = moment(date);
        this.setState({
            dateMoment,
        });
        const timestamp = utils.convertToUnixTimestampSeconds(dateMoment, this.state.timeMoment);
        this.props.updateOrderExpiry(timestamp);
    }
    private _onTimeChanged(_event: any, time: Date): void {
        const timeMoment = moment(time);
        this.setState({
            timeMoment,
        });
        const dateMoment = _.isUndefined(this.state.dateMoment) ? moment() : this.state.dateMoment;
        const timestamp = utils.convertToUnixTimestampSeconds(dateMoment, timeMoment);
        this.props.updateOrderExpiry(timestamp);
    }
}
