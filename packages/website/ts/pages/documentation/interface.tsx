import * as _ from 'lodash';
import * as React from 'react';
import {MethodSignature} from 'ts/pages/documentation/method_signature';
import {Type} from 'ts/pages/documentation/type';
import {CustomType, TypeDocTypes} from 'ts/types';

interface InterfaceProps {
    type: CustomType;
}

export function Interface(props: InterfaceProps) {
    const type = props.type;
    const properties = _.map(type.children, property => {
        return (
            <span key={`property-${property.name}-${property.type}-${type.name}`}>
                {property.name}:{' '}
                {property.type.typeDocType !== TypeDocTypes.Reflection ?
                    <Type type={property.type} /> :
                    <MethodSignature
                        method={property.type.method}
                        shouldHideMethodName={true}
                        shouldUseArrowSyntax={true}
                    />
                },
            </span>
        );
    });
    const hasIndexSignature = !_.isUndefined(type.indexSignature);
    if (hasIndexSignature) {
        const is = type.indexSignature;
        const param = (
            <span key={`indexSigParams-${is.keyName}-${is.keyType}-${type.name}`}>
                {is.keyName}: <Type type={is.keyType} />
            </span>
        );
        properties.push((
            <span key={`indexSignature-${type.name}-${is.keyType.name}`}>
                [{param}]: {is.valueName},
            </span>
        ));
    }
    const propertyList = _.reduce(properties, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, '\n\t', curr];
    });
    return (
        <span>
            {`{`}
                <br />
                {'\t'}{propertyList}
                <br />
            {`}`}
        </span>
    );
}
