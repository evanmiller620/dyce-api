const chai = require("chai");
const chaiHttp = require("chai-http");
const { describe, it } = require("mocha");

// Use chai-http
chai.use(chaiHttp);

const { expect } = chai;

describe("Root get test", function () {
  it("should return 200 for GET /", async function () {
    const app = (await import("../index.js")).default;
    const res = await chai.request(app).get("/");
    expect(res).to.have.status(200);
  });
});

describe("user Test", function () {
  it("should return 200 for GET /user", async function () {
    const app = (await import("../index.js")).default;
    const res = await chai.request(app).get("/user");
    expect(res).to.have.status(200);
  });
});