import nock from "nock";
import { readFile, writeFile, unlink } from "fs/promises";

import app from "../../app.js";
import { updateHostnames } from "../../lib/simplyApi.js";

Feature("Update simply dns records", () => {
  const configFilePath = "./config/config.json";
  const ipFilePath = "./config/.ip";
  let orgConfigFile, orgIPFile;

  beforeEachScenario(async () => {
    try {
      orgConfigFile = await readFile(configFilePath);
      orgIPFile = await readFile(ipFilePath);
    } catch { } // eslint-disable-line
  });

  afterEachScenario(async () => {
    nock.cleanAll();
    if (orgConfigFile) {
      await writeFile(configFilePath, orgConfigFile);
    } else {
      unlink(configFilePath);
    }
    if (orgIPFile) {
      await writeFile(ipFilePath, orgIPFile);
    } else {
      unlink(ipFilePath);
    }
  });

  async function fakeConfig() {
    const config = {
      account: "kaka",
      apikey: "kaka",
      domains: { "example.com": [ "kaka.example.com" ] },
    };
    await writeFile(configFilePath, JSON.stringify(config));
  }

  function captureErrors() {
    const errors = [];
    const orgConsoleError = console.error; // eslint-disable-line no-console
    console.error = (...args) => errors.push(args.join(" ")); // eslint-disable-line no-console
    errors.restore = () => {
      console.error = orgConsoleError; // eslint-disable-line no-console
    };
    return errors;
  }

  Scenario("First time update of all dns records for specified domains", () => {
    let fakeIPApi, fakeSimplyAPI;
    let calledPath = "", headers = {};

    When("Configfile exists", () => fakeConfig());

    And("ip file with previos IP doesnt exists", async () => {
      try {
        await unlink(ipFilePath);
      } catch { } // eslint-disable-line
    });

    And("Simply api is available", async () => {
      fakeSimplyAPI = nock("https://ddns.simply.com");

      await fakeSimplyAPI.get("/nic/update").query({
        hostname: "kaka.example.com",
        domain: "example.com",
        myip: "96.69.96.69",
      }).reply(200, function (path) {
        calledPath = path;
        headers = this.req.headers;

        return "good 96.69.96.69";
      });
    });

    And("IP API is available", async () => {
      fakeIPApi = nock("https://api.ipify.org");
      await fakeIPApi.get("/").query({ format: "json" }).reply(200, { ip: "96.69.96.69" });
    });

    Then("it should run", async () => {
      await app();
    });

    And("IP should have been fetched from the API", () => {
      expect(fakeIPApi.isDone()).to.be.true;
    });

    And("Simply api should have been called", () => {
      expect(fakeSimplyAPI.isDone()).to.be.true;
    });

    And("It should have updated the correct domain", () => {
      expect(calledPath).to.equal("/nic/update?hostname=kaka.example.com&domain=example.com&myip=96.69.96.69");
    });

    And("It should have provided basic auth headers", () => {
      expect(headers).to.have.property("authorization").and.equal("Basic a2FrYTprYWth");
    });

    And("It should have created a hidden file, .ip, containing the last fetched IP", async () => {
      let ipFileContent;
      try {
        ipFileContent = await readFile(ipFilePath, "utf-8");
      } catch { } // eslint-disable-line
      expect(ipFileContent).to.equal("96.69.96.69");
    });

  });

  Scenario("Update domains when IP has changed", () => {
    let fakeIPApi, fakeSimplyAPI;

    When("Configfile exists", () => fakeConfig());

    And("ip file with previos IP does exist", async () => {
      try {
        await writeFile(ipFilePath, "96.69.96.69");
      } catch { } // eslint-disable-line
    });

    And("Simply api is available", async () => {
      fakeSimplyAPI = nock("https://ddns.simply.com");
      await fakeSimplyAPI.get("/nic/update").query({
        hostname: "kaka.example.com",
        domain: "example.com",
        myip: "92.69.96.69",
      }).reply(200, "good 92.69.96.69");
    });

    And("IP API is available", async () => {
      fakeIPApi = nock("https://api.ipify.org");
      await fakeIPApi.get("/").query({ format: "json" }).reply(200, { ip: "92.69.96.69" });
    });

    Then("it should run", async () => {
      await app();
    });

    And("IP should have been fetched from the API", () => {
      expect(fakeIPApi.isDone()).to.be.true;
    });

    And("Simply api should have been called with the new IP", () => {
      expect(fakeSimplyAPI.isDone()).to.be.true;
    });

    And("It should have updated the IP in the .ip file", async () => {
      let ipFileContent;
      try {
        ipFileContent = await readFile(ipFilePath, "utf-8");
      } catch { } // eslint-disable-line
      expect(ipFileContent).to.equal("92.69.96.69");
    });

  });

  Scenario("Domains should not be updated if ip hasnt changed", () => {
    let fakeIPApi, fakeSimplyAPI;

    When("Configfile exists", () => fakeConfig());

    And("ip file with previos IP does exist", async () => {
      try {
        await writeFile(ipFilePath, "96.69.96.69");
      } catch { } // eslint-disable-line
    });

    And("Simply api is available", async () => {
      fakeSimplyAPI = nock("https://ddns.simply.com");
      await fakeSimplyAPI.get("/nic/update").query(true).reply(200, "good 96.69.96.69");
    });

    And("IP API is available", async () => {
      fakeIPApi = nock("https://api.ipify.org");
      await fakeIPApi.get("/").query({ format: "json" }).reply(200, { ip: "96.69.96.69" });
    });

    Then("it should run", async () => {
      await app();
    });

    And("IP should have been fetched from the API", () => {
      expect(fakeIPApi.isDone()).to.be.true;
    });

    And("Simply api should not have been called", () => {
      expect(fakeSimplyAPI.isDone()).to.not.be.true;
    });
  });

  Scenario("All hostnames of a domain are updated in one request and missing records are reported", () => {
    let fakeSimplyAPI, errors;

    When("Configfile exists", () => fakeConfig());

    And("Simply api is available and bar.example.com has no record", async () => {
      fakeSimplyAPI = nock("https://ddns.simply.com");
      await fakeSimplyAPI.get("/nic/update").query({
        hostname: "foo.example.com,bar.example.com",
        domain: "example.com",
        myip: "96.69.96.69",
      }).reply(200, "good 96.69.96.69\nnohost");
    });

    Then("both hostnames are updated", async () => {
      errors = captureErrors();
      try {
        await updateHostnames("example.com", [ "foo.example.com", "bar.example.com" ], "96.69.96.69");
      } finally {
        errors.restore();
      }
    });

    And("Simply api should have been called once for both hostnames", () => {
      expect(fakeSimplyAPI.isDone()).to.be.true;
    });

    And("It should have reported that the record for bar.example.com must be created first", () => {
      expect(errors).to.have.lengthOf(1);
      expect(errors[0]).to.include("bar.example.com").and.include("Create the record first");
    });
  });

  Scenario("More than 20 hostnames are split into several requests", () => {
    let fakeSimplyAPI;
    const hostnames = Array.from({ length: 21 }, (_, index) => `host${index}.example.com`);

    When("Configfile exists", () => fakeConfig());

    And("Simply api is available", async () => {
      fakeSimplyAPI = nock("https://ddns.simply.com");
      await fakeSimplyAPI.get("/nic/update").query({
        hostname: hostnames.slice(0, 20).join(","),
        domain: "example.com",
        myip: "96.69.96.69",
      }).reply(200, Array(20).fill("good 96.69.96.69").join("\n"));
      await fakeSimplyAPI.get("/nic/update").query({
        hostname: hostnames[20],
        domain: "example.com",
        myip: "96.69.96.69",
      }).reply(200, "good 96.69.96.69");
    });

    Then("all hostnames are updated", async () => {
      await updateHostnames("example.com", hostnames, "96.69.96.69");
    });

    And("Simply api should have been called twice", () => {
      expect(fakeSimplyAPI.isDone()).to.be.true;
    });
  });
});
