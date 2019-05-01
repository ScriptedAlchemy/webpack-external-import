describe('external script', () => {
    let logs = [];

    beforeAll(async () => {
        page.on('console', msg => logs.push(msg.text()));
    })

    afterEach(() => {
        logs = [];
    })
  
    it('should console.log', async () => {
        await page.goto('http://localhost:8080');
        // await page.waitFor(10000);
        await page.waitFor(() => false);
        expect(logs).toContain('some function thats externalized');
    })
});