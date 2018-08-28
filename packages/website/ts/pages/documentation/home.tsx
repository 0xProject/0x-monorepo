import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { DocsContentTopBar } from 'ts/components/documentation/docs_content_top_bar';
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { Translate } from 'ts/utils/translate';

export interface HomeProps {
    location: Location;
    translate: Translate;
}

export interface HomeState {}

export class Home extends React.Component<HomeProps, HomeState> {
    public render(): React.ReactNode {
        return (
            <div
                className="flex items-center"
                style={{
                    width: '100%',
                    background: 'linear-gradient(to right, #f5f5f5 0%, #f5f5f5 50%, #ffffff 50%, #ffffff 100%)',
                }}
            >
                <DocumentTitle title="0x Docs Home" />
                <div className="flex mx-auto">
                    <div
                        style={{
                            width: 234,
                            paddingLeft: 22,
                            paddingRight: 22,
                            backgroundColor: '#f5f5f5',
                            height: '100vh',
                            border: '1px black dotted',
                        }}
                    >
                        <DocsLogo />
                    </div>
                    <div
                        style={{
                            width: 716,
                            paddingLeft: 50,
                            paddingRight: 50,
                            backgroundColor: '#ffffff',
                            height: '100vh',
                            border: '1px black dotted',
                        }}
                    >
                        <DocsContentTopBar location={this.props.location} translate={this.props.translate} />
                    </div>
                </div>
            </div>
        );
    }
}
