import * as _ from 'lodash';
import * as React from 'react';
import Paper from 'material-ui/Paper';
import {utils} from 'ts/utils/utils';
import {DefaultPlayer as Video} from 'react-html5video';
import 'react-html5video/dist/styles.css';

interface LoadingProps {}

interface LoadingState {}

export class Loading extends React.Component<LoadingProps, LoadingState> {
    public render() {
        return (
            <div className="pt4 sm-px2 sm-pt2 sm-m1" style={{height: 500}}>
                <Paper className="mx-auto" style={{maxWidth: 400}}>
                    {utils.isUserOnMobile() ?
                        <img className="p1" src="/gifs/0xAnimation.gif" width="96%" /> :
                        <div style={{pointerEvents: 'none'}}>
                            <Video
                                autoPlay={true}
                                loop={true}
                                muted={true}
                                controls={[]}
                                poster="/images/loading_poster.png"
                            >
                                <source src="/videos/0xAnimation.mp4" type="video/mp4" />
                            </Video>
                        </div>
                    }
                    <div className="center pt2" style={{paddingBottom: 11}}>Connecting to the blockchain...</div>
                </Paper>
            </div>
        );
    }
}
