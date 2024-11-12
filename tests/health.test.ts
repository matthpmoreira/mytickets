import httpStatus from "http-status";
import supertest from "supertest";
import { app } from "index";

const api = supertest(app);

describe("GET /health", () => {
  it("should respond healthily", async () => {
    const { status, text } = await api.get("/health");

    expect(status).toEqual(httpStatus.OK);
    expect(text).toEqual("I'm okay!");
  });
});
