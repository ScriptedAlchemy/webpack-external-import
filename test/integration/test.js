describe('external script', () => {
    let logs = [];

    beforeAll(async () => {
        page.on('console', msg => logs.push(msg.text()));
    });

    afterEach(() => {
        logs = [];
    });
  
    it('should console.log', async () => {
        await page.goto('http://localhost:8080');
        await page.waitForResponse('http://localhost:8080/other.js');
        await page.waitFor(() => window.wasExternalFunctionCalled);
        expect(logs).toContain('some function thats externalized');
    });
});