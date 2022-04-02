const request = require("supertest");
const app = require("../index");

// API tests
describe("GET /owners", function () {
  it("get owners", function (done) {
    request(app).get("/owners").expect(200, done);
  });
});

describe("POST /api/owners", function () {
  it("add new owner", function (done) {
    request(app)
      .post("/api/owners")
      .send({
        name: "new user",
        email: "test@example.com",
        address: "address 11",
      })
      .expect(201, done);
  });
});

describe("UPDATE /api/owners/:id", function () {
  it("update owner", function (done) {
    request(app)
      .put("/api/owners/67bdd1e0-10a7-4c7d-9934-8b7761ee8615")
      .send({
        name: "new user updated",
      })
      .expect(201, done);
  });
});

describe("DELETE /api/owners/:id", function () {
  it("update owner", function (done) {
    request(app)
      .delete("/api/owners/67bdd1e0-10a7-4c7d-9934-8b7761ee8615")
      .expect(200, done);
  });
});
