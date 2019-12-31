/* eslint-env jest */
/* globals page */

import server from "../../manual/spawn-server";
import "regenerator-runtime/runtime";

const waitFor200 = async (page, url) =>
  new Promise((resolve, reject) => {
    page
      .goto(url)
      .then(res => {
        if (res.status() === 200) {
          resolve();
        } else {
          reject();
        }
      })
      .catch(reject);
  });

describe("integration", () => {
  beforeAll(() => jest.setTimeout(30000));

  describe("external script", () => {
    let logs = [];

    beforeEach(async () => {
      page.on("console", msg => logs.push(msg.text()));

      await server.start();
    });

    afterEach(() => {
      logs = [];
      page.removeAllListeners();

      server.stop();
    });

    it("runs without error", async () => {
      await waitFor200(page, "http://localhost:3002/importManifest.js");
      await waitFor200(page, "http://localhost:3001");
      await page.waitForResponse(res =>
        /3002.*TitleComponent\..*\.js/.test(res.url())
      );
      await page.waitFor(() => window.wasExternalFunctionCalled);
      expect(logs).toContain("TitleComponent interleaving successful");
    });
  });
});
