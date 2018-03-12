declare module 'dirty-chai';

declare module 'newman' {
    export interface NewmanRunSummary {
        run: NewmanRun;
    }
    export interface NewmanRun {
        executions: NewmanRunExecution[];
    }
    export interface NewmanRunExecution {
        item: NewmanRunExecutionItem;
        assertions: NewmanRunExecutionAssertion[];
    }
    export interface NewmanRunExecutionItem {
        name: string;
    }
    export interface NewmanRunExecutionAssertion {
        assertion: string;
        error: NewmanRunExecutionAssertionError;
    }
    export interface NewmanRunExecutionAssertionError {
        message: string;
    }
    export function run(options: any, callback?: (err: Error | null, summary: NewmanRunSummary) => void): void;
}

declare module '*.json' {
    const value: any;
    export default value;
}
