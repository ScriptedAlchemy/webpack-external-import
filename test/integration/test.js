import server from '../../manual/server';

beforeAll(async () => {
    await server.start();
});

afterAll(() => {
    server.stop();
});

describe('external script', () => {
    let logs = [];

    beforeEach(() => {
        page.on('console', msg => logs.push(msg.text()));
    });

    afterEach(() => {
        logs = [];
        page.removeAllListeners();
    });

    it('should console.log', async () => {
        await page.goto('http://localhost:3001');

        await page.waitForResponse('http://localhost:3002/hello-world.js');

        await page.waitFor(() => window.wasExternalFunctionCalled);
        expect(logs).toContain('some function thats externalized');
    });
});
