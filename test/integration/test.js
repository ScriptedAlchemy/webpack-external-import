const puppeteer = require('puppeteer');

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
        expect(logs).toContain('some function thats externalized');
    })
});

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   page.on('console', msg => console.log('PAGE LOG:', msg.text()));
//   await page.goto('http://localhost:8080');

//   await browser.close();
// })();