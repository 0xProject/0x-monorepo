import { Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Footer } from 'ts/components/footer';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Translate } from 'ts/utils/translate';

export interface NotFoundProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

interface NotFoundState {}

const styles: Styles = {
    thin: {
        fontWeight: 100,
    },
};

export class NotFound extends React.Component<NotFoundProps, NotFoundState> {
    public render(): React.ReactNode {
        return (
            <div>
                <TopBar blockchainIsLoaded={false} location={this.props.location} translate={this.props.translate} />
                <div className="mx-auto max-width-4 py4">
                    <div className="center py4">
                        <div className="py4">
                            <div className="py4">
                                <h1 style={{ ...styles.thin }}>404 Not Found</h1>
                                <div className="py1">
                                    <div className="py3">
                                        Hm... looks like we couldn't find what you are looking for.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </div>
        );
    }
}
