/**
 * This module is a CLI tool. As soon as you run it - it starts doing stuff.
 * At the same time - our installation tests assume that you can import package without causing side effects.
 * That's why our main entry point it empty. No side effects. But our secondary entry point - contracts-gen.ts is a CLI tool and starts running as soon as you import/run it.
 */
export {};
