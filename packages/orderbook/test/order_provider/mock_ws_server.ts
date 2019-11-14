import * as http from 'http';
import * as WebSocket from 'websocket';

const DEFAULT_STATUS_CODE = 404;
export const SERVER_PORT = 64321;
// tslint:disable-next-line:custom-no-magic-numbers
const sixtyFourMB = 64 * 1024 * 1024; // 64MiB

let server: http.Server;
let wsServer: WebSocket.server;

/**
 * Sets up a new test WS server
 * @return A WS server
 */
export async function setupServerAsync(): Promise<WebSocket.server> {
    return new Promise<WebSocket.server>((resolve, reject) => {
        server = http.createServer((_request, response) => {
            response.writeHead(DEFAULT_STATUS_CODE);
            response.end();
        });

        wsServer = new WebSocket.server({
            httpServer: server,
            autoAcceptConnections: true,
            maxReceivedFrameSize: sixtyFourMB,
            maxReceivedMessageSize: sixtyFourMB,
            fragmentOutgoingMessages: false,
            keepalive: false,
            disableNagleAlgorithm: false,
        });

        server.listen(SERVER_PORT, () => {
            resolve(wsServer);
        });
    });
}

/**
 * Stops the test WS server
 */
export function stopServer(): void {
    try {
        wsServer.shutDown();
        server.close();
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.log('stopServer threw', e);
    }
}
