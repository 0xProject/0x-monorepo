import * as _ from 'lodash';
import * as React from 'react';
import TextField from 'material-ui/TextField';
import { InputLabel } from 'ts/components/ui/input_label';
import { RequiredLabel } from 'ts/components/ui/required_label';
import { colors } from 'ts/utils/colors';
import { HashData } from 'ts/types';

interface MessageInputProps {
    isRequired?: boolean;
    label: string;
    hashData?: HashData; //remove?
    updateMessage: (message?: string) => void;
}

interface MessageInputState {
    message: string;
}

export class MessageInput extends React.Component<MessageInputProps, MessageInputState> {
    constructor(props: MessageInputProps) {
        super(props);
        this.state = {
            message: '',
        };
    }
    public render() {
        const label = this.props.isRequired ? <RequiredLabel label={this.props.label} /> : this.props.label;
        return (
            <div className="relative" style={{ width: '100%' }}>
                <InputLabel text={label} />
                <div className="flex">
                    <div className="col col-11 pb1 pl1" style={{ height: 65 }}>
                      <TextField
                          id={`message-field-${this.props.label}`}
                          fullWidth={true}
                          floatingLabelFixed={false}
                          value={this.state.message}
                          onChange={this._onMessageUpdated.bind(this)}
                      />
                    </div>
                </div>
            </div>
        );
    }
    private _onMessageUpdated(e: any) {
      const message = e.target.value;
        this.setState({
            message,
        });
        this.props.updateMessage(message);
    }
}
