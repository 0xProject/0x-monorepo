import { Request, RequestHandler } from '../index';

export class CoordinatorHandler implements RequestHandler {
    public canHandle(request: Request): boolean {
        return true;
    }

    public handle(request: Request): string {
        return 'ok';
    }
}
