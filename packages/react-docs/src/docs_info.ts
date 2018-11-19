import { ALink, utils as sharedUtils } from '@0x/react-shared';
import { DocAgnosticFormat, ObjectMap, TypeDefinitionByName } from '@0x/types';
import * as _ from 'lodash';

import {
    ContractsByVersionByNetworkId,
    DocsInfoConfig,
    DocsMenu,
    SectionNameToMarkdownByVersion,
    SectionsMap,
    SupportedDocJson,
} from './types';
import { constants } from './utils/constants';

export class DocsInfo {
    public id: string;
    public type: SupportedDocJson;
    public displayName: string;
    public packageName: string;
    public packageUrl: string;
    public markdownMenu: DocsMenu;
    public typeSectionName: string;
    public sections: SectionsMap;
    public sectionNameToMarkdownByVersion: SectionNameToMarkdownByVersion;
    public contractsByVersionByNetworkId?: ContractsByVersionByNetworkId;
    constructor(config: DocsInfoConfig) {
        this.id = config.id;
        this.type = config.type;
        this.markdownMenu = config.markdownMenu;
        this.displayName = config.displayName;
        this.packageName = config.packageName;
        this.packageUrl = config.packageUrl;
        this.typeSectionName = config.type === SupportedDocJson.SolDoc ? 'structs' : 'types';
        this.sections = config.markdownSections;
        this.sectionNameToMarkdownByVersion = config.sectionNameToMarkdownByVersion;
        this.contractsByVersionByNetworkId = config.contractsByVersionByNetworkId;
    }
    public getTypeDefinitionsByName(docAgnosticFormat: DocAgnosticFormat): ObjectMap<TypeDefinitionByName> {
        if (_.isUndefined(docAgnosticFormat[this.typeSectionName])) {
            return {};
        }

        const section = docAgnosticFormat[this.typeSectionName];
        const typeDefinitionByName = _.keyBy(section.types, 'name') as any;
        return typeDefinitionByName;
    }
    public getSectionNameToLinks(docAgnosticFormat: DocAgnosticFormat): ObjectMap<ALink[]> {
        const sectionNameToLinks: ObjectMap<ALink[]> = {};
        _.each(this.markdownMenu, (linkTitles, sectionName) => {
            sectionNameToLinks[sectionName] = [];
            _.each(linkTitles, linkTitle => {
                const to = sharedUtils.getIdFromName(linkTitle);
                const links = sectionNameToLinks[sectionName];
                links.push({
                    title: linkTitle,
                    to,
                });
            });
        });

        if (_.isUndefined(docAgnosticFormat)) {
            return sectionNameToLinks;
        }

        const docSections = _.keys(this.sections);
        _.each(docSections, sectionName => {
            const docSection = docAgnosticFormat[sectionName];
            if (_.isUndefined(docSection) || sectionName === constants.EXTERNAL_EXPORTS_SECTION_NAME) {
                return; // no-op
            }

            const isExportedFunctionSection =
                docSection.functions.length === 1 &&
                _.isEmpty(docSection.types) &&
                _.isEmpty(docSection.methods) &&
                _.isEmpty(docSection.constructors) &&
                _.isEmpty(docSection.properties) &&
                _.isEmpty(docSection.events);

            if (sectionName === this.typeSectionName) {
                const sortedTypesNames = _.sortBy(docSection.types, 'name');
                const typeNames = _.map(sortedTypesNames, t => t.name);
                const typeLinks = _.map(typeNames, typeName => {
                    return {
                        to: `${sectionName}-${typeName}`,
                        title: typeName,
                    };
                });
                sectionNameToLinks[sectionName] = typeLinks;
            } else if (isExportedFunctionSection) {
                // Noop so that we don't have the method listed underneath itself.
            } else {
                let eventNames: string[] = [];
                if (!_.isUndefined(docSection.events)) {
                    const sortedEventNames = _.sortBy(docSection.events, 'name');
                    eventNames = _.map(sortedEventNames, m => m.name);
                }
                const propertiesSortedByName = _.sortBy(docSection.properties, 'name');
                const propertyNames = _.map(propertiesSortedByName, m => m.name);
                const methodsSortedByName = _.sortBy(docSection.methods, 'name');
                const methodNames = _.map(methodsSortedByName, m => m.name);
                const sortedFunctionNames = _.sortBy(docSection.functions, 'name');
                const functionNames = _.map(sortedFunctionNames, m => m.name);
                const names = [...eventNames, ...propertyNames, ...functionNames, ...methodNames];

                const links = _.map(names, name => {
                    return {
                        to: `${sectionName}-${name}`,
                        title: name,
                    };
                });

                sectionNameToLinks[sectionName] = links;
            }
        });
        return sectionNameToLinks;
    }
}
