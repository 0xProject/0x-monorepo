import { DocAgnosticFormat, DocSection } from '@0xproject/types';

export class SolidityDocFormat implements DocAgnosticFormat {
    [sectionName: string]: DocSection;
}
