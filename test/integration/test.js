import server from '../../manual/server';
import 'regenerator-runtime/runtime';

const retry = fn => new Promise((resolve) => {
  fn()
    .then(resolve)
    .catch(() => {
      setTimeout(() => {
        console.log('retrying...');
        retry(fn).then(resolve);
      }, 1000);
    });
});

const waitFor200 = (page, url) => retry(() => new Promise((resolve, reject) => {
  page
    .goto(url)
    .then((res) => {
      if (res.status() === 200) {
        resolve();
      } else {
        reject();
      }
    })
    .catch(reject);
}));

beforeAll(async () => {
  jest.setTimeout(30000);
  await server.start();
});

afterAll(() => {
  server.stop();
});

xdescribe('external script', () => {
  let logs = [];

  beforeEach(() => {
    page.on('console', msg => logs.push(msg.text()));
  });

  afterEach(() => {
    logs = [];
    page.removeAllListeners();
  });

  it('should console.log', async () => {
    jest.setTimeout(30000);

    await page.waitFor(1000);
    await waitFor200(page, 'http://localhost:3002/importManifest.js');
    await page.goto('http://localhost:3001');
    await page.waitForResponse('http://localhost:3002/hello-world.js');
    await page.waitFor(() => window.wasExternalFunctionCalled);
    expect(logs).toContain('some function thats externalized');
  });
});
