import request from "supertest";
import {app,server} from "../index.js"; // Assuming the app is exported from index.js

describe("Root endpoint", () => {
  it("should return 200 for GET /", async () => {
    const res = await request(app).get("/");
    console.log(res.body);
    expect(res.status).toBe(200);
  });
});

describe("User endpoint", () => {
  it("should return 200 for GET /user", async () => {
    const res = await request(app).get("/user");
    console.log(res.body);
    expect(res.status).toBe(200);
  });
});

afterAll(() => {
  server.close();  // Gracefully close the server
});