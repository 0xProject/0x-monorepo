import { Property, TypeDefinitionByName } from '@0x/types';
import * as React from 'react';
import { AnchorTitle } from 'ts/components/documentation/shared/anchor_title';

import { HeaderSizes } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { DocsInfo } from 'ts/utils/docs_info';

import { Comment } from './comment';
import { SourceLink } from './source_link';
import { Type } from './type';

export interface PropertyBlockProps {
    property: Property;
    sectionName: string;
    docsInfo: DocsInfo;
    sourceUrl: string;
    selectedVersion: string;
    typeDefinitionByName: TypeDefinitionByName;
}

export interface PropertyBlockState {
    shouldShowAnchor: boolean;
}

export class PropertyBlock extends React.Component<PropertyBlockProps, PropertyBlockState> {
    constructor(props: PropertyBlockProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render(): React.ReactNode {
        const property = this.props.property;
        const sectionName = this.props.sectionName;
        return (
            <div
                id={`${this.props.sectionName}-${property.name}`}
                className="pb4 pt2"
                key={`property-${property.name}-${property.type.name}`}
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <div className="pb2" style={{ lineHeight: 1.3 }}>
                    <AnchorTitle
                        headerSize={HeaderSizes.H3}
                        title={property.name}
                        id={`${sectionName}-${property.name}`}
                        shouldShowAnchor={this.state.shouldShowAnchor}
                    />
                </div>
                <code className={`hljs ${constants.TYPE_TO_SYNTAX[this.props.docsInfo.type]}`}>
                    {(property as any).callPath}
                    {property.name}:{' '}
                    <Type
                        type={property.type}
                        sectionName={sectionName}
                        docsInfo={this.props.docsInfo}
                        typeDefinitionByName={this.props.typeDefinitionByName}
                        isInPopover={false}
                    />
                </code>
                {property.source && (
                    <SourceLink
                        version={this.props.selectedVersion}
                        source={property.source}
                        sourceUrl={this.props.sourceUrl}
                    />
                )}
                {property.comment && <Comment comment={property.comment} className="py2" />}
            </div>
        );
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean): void {
        this.setState({
            shouldShowAnchor,
        });
    }
}
