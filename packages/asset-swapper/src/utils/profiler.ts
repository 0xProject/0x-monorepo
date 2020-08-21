export class Profiler {

    public readonly started: number;
    public ended: number = 0;

    public static begin(name?: string): Profiler {
        return new Profiler(name || arguments.callee.name);
    }

    public static async timeAsync<TResult>(name: string, callback: () => Promise<TResult>): Promise<TResult>;
    public static async timeAsync<TResult>(callback: () => Promise<TResult>): Promise<TResult>;
    public static async timeAsync(a: any, b?: any): Promise<any> {
        let name = 'unknown';
        let callback = () => {};
        if (typeof a === 'string') {
            name = a;
        }
        if (typeof b === 'function') {
            callback = b;
        }
        const p = Profiler.begin(name);
        const r = await callback();
        p.end();
        return r;
    }
    public static time<TResult>(name: string, callback: () => TResult): TResult;
    public static time<TResult>(callback: () => TResult): TResult;
    public static time(a: any, b?: any): any {
        let name = 'unknown';
        let callback = () => {};
        if (typeof a === 'string') {
            name = a;
        }
        if (typeof b === 'function') {
            callback = b;
        }
        const p = Profiler.begin(name);
        const r = callback();
        p.end();
        return r;
    }

    protected constructor(public readonly name: string) {
        this.started = Date.now();
    }

    public end(quiet: boolean = false): number {
        this.ended = Date.now();
        if (!quiet) {
            this._log();
        }
        return this.ended;
    }

    protected _log(): void {
        const t = new Date().toLocaleString();
        const d = (this.ended - this.started) / 1e3;
        console.info(`[${t}] "${this.name}" took ${d}s.`);
    }
}
