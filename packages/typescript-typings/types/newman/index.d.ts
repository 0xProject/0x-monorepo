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
    // tslint:disable-next-line:completed-docs
    export function run(options: any, callback?: (err: Error | null, summary: NewmanRunSummary) => void): void;
}
