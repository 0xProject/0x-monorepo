import * as _ from 'lodash';
import * as React from 'react';

import { DocsInfo } from '../docs_info';
import { CustomType, TypeDocTypes } from '../types';

import { MethodSignature } from './method_signature';
import { Type } from './type';

export interface InterfaceProps {
    type: CustomType;
    sectionName: string;
    docsInfo: DocsInfo;
}

export function Interface(props: InterfaceProps) {
    const type = props.type;
    const properties = _.map(type.children, property => {
        return (
            <span key={`property-${property.name}-${property.type}-${type.name}`}>
                {property.name}:{' '}
                {property.type.typeDocType !== TypeDocTypes.Reflection ? (
                    <Type type={property.type} sectionName={props.sectionName} docsInfo={props.docsInfo} />
                ) : (
                    <MethodSignature
                        method={property.type.method}
                        sectionName={props.sectionName}
                        shouldHideMethodName={true}
                        shouldUseArrowSyntax={true}
                        docsInfo={props.docsInfo}
                    />
                )},
            </span>
        );
    });
    const hasIndexSignature = !_.isUndefined(type.indexSignature);
    if (hasIndexSignature) {
        const is = type.indexSignature;
        const param = (
            <span key={`indexSigParams-${is.keyName}-${is.keyType}-${type.name}`}>
                {is.keyName}: <Type type={is.keyType} sectionName={props.sectionName} docsInfo={props.docsInfo} />
            </span>
        );
        properties.push(
            <span key={`indexSignature-${type.name}-${is.keyType.name}`}>
                [{param}]: {is.valueName},
            </span>,
        );
    }
    const propertyList = _.reduce(properties, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, '\n\t', curr];
    });
    return (
        <span>
            {`{`}
            <br />
            {'\t'}
            {propertyList}
            <br />
            {`}`}
        </span>
    );
}
