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
            <TopBar blockchainIsLoaded={false} location={props.location} translate={props.translate} />
            <FullscreenMessage
                headerText={'404 Not Found'}
                bodyText={"Hm... looks like we couldn't find what you are looking for."}
            />
            <Footer translate={props.translate} dispatcher={props.dispatcher} />
        </div>
    );
};
