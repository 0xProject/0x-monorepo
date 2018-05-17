import { Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Footer } from 'ts/components/footer';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { FullscreenMessage } from 'ts/pages/fullscreen_message';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Translate } from 'ts/utils/translate';

export interface NotFoundProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

export const NotFound = (props: NotFoundProps) => {
    return (
        <div>
            <TopBar blockchainIsLoaded={false} location={this.props.location} translate={this.props.translate} />
            <FullscreenMessage
                headerText={'404 Not Found'}
                bodyText={"Hm... looks like we couldn't find what you are looking for."}
            />
            <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
        </div>
    );
};
