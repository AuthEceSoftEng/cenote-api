require("dotenv").config();
const request = require("supertest")(require(".."));

describe("The Server", () => {
  test("serves as an example endpoint", async (done) => {
    const response = await request.get("/works");
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("It does!");
    done();
  });

  test("serves docs", async (done) => {
    const response = await request.get("/docs");
    expect(response.statusCode).toBe(301);
    expect(response.header["content-type"].toLowerCase()).toBe("text/html; charset=utf-8");
    done();
  });
});
