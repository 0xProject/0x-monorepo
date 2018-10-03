import { ALink, LinkType, MenuSubsectionsBySection, utils as sharedUtils } from '@0xproject/react-shared';
import { DocAgnosticFormat, ObjectMap, TypeDefinitionByName } from '@0xproject/types';
import * as _ from 'lodash';

import {
    ContractsByVersionByNetworkId,
    DocsInfoConfig,
    DocsMenu,
    SectionNameToMarkdownByVersion,
    SectionsMap,
    SupportedDocJson,
} from './types';

export class DocsInfo {
    public id: string;
    public type: SupportedDocJson;
    public displayName: string;
    public packageName: string;
    public packageUrl: string;
    public menu: DocsMenu;
    public sections: SectionsMap;
    public sectionNameToMarkdownByVersion: SectionNameToMarkdownByVersion;
    public contractsByVersionByNetworkId?: ContractsByVersionByNetworkId;
    constructor(config: DocsInfoConfig) {
        this.id = config.id;
        this.type = config.type;
        this.menu = config.markdownMenu;
        this.displayName = config.displayName;
        this.packageName = config.packageName;
        this.packageUrl = config.packageUrl;
        this.sections = config.markdownSections;
        this.sectionNameToMarkdownByVersion = config.sectionNameToMarkdownByVersion;
        this.contractsByVersionByNetworkId = config.contractsByVersionByNetworkId;
    }
    public getSubsectionNameToLinks(docAgnosticFormat?: DocAgnosticFormat): ObjectMap<ALink[]> {
        const subsectionNameToLinks: ObjectMap<ALink[]> = {};
        if (_.isUndefined(docAgnosticFormat)) {
            return subsectionNameToLinks;
        }

        const docSections = _.keys(this.sections);
        _.each(docSections, sectionName => {
            const docSection = docAgnosticFormat[sectionName];
            if (_.isUndefined(docSection)) {
                return; // no-op
            }

            const isExportedFunctionSection =
                docSection.functions.length === 1 &&
                _.isEmpty(docSection.types) &&
                _.isEmpty(docSection.methods) &&
                _.isEmpty(docSection.constructors) &&
                _.isEmpty(docSection.properties) &&
                _.isEmpty(docSection.events);

            if (!_.isUndefined(this.sections.types) && sectionName === this.sections.types) {
                const sortedTypesNames = _.sortBy(docSection.types, 'name');
                const typeNames = _.map(sortedTypesNames, t => t.name);
                const typeLinks = _.map(typeNames, typeName => {
                    return {
                        to: `${sectionName}-${typeName}`,
                        title: typeName,
                        type: LinkType.ReactScroll,
                    };
                });
                subsectionNameToLinks[sectionName] = typeLinks;
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
                        type: LinkType.ReactScroll,
                    };
                });

                subsectionNameToLinks[sectionName] = links;
            }
        });
        return subsectionNameToLinks;
    }
    public getTypeDefinitionsByName(docAgnosticFormat: DocAgnosticFormat): { [name: string]: TypeDefinitionByName } {
        if (_.isUndefined(this.sections.types)) {
            return {};
        }

        const typeDocSection = docAgnosticFormat[this.sections.types];
        const typeDefinitionByName = _.keyBy(typeDocSection.types, 'name') as any;
        return typeDefinitionByName;
    }
    public getSectionNameToLinks(): ObjectMap<ALink[]> {
        const sectionNameToLinks: ObjectMap<ALink[]> = {};
        _.each(this.menu, (linkTitles, sectionName) => {
            sectionNameToLinks[sectionName] = [];
            _.each(linkTitles, linkTitle => {
                const to = sharedUtils.getIdFromName(linkTitle);
                const links = sectionNameToLinks[sectionName];
                links.push({
                    title: linkTitle,
                    to,
                    type: LinkType.ReactScroll,
                });
            });
        });
        return sectionNameToLinks;
    }
}
