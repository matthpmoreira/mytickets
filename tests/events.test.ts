import httpStatus from "http-status";
import supertest from "supertest";
import prisma from "database";
import { app } from "index";
import { EventFactory } from "./factories";

const api = supertest(app);

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.ticket.deleteMany();
});

describe("GET /events", () => {
  it("should get a list of events", async () => {
    await prisma.event.createMany({
      data: [EventFactory(), EventFactory()],
    });

    const { status, body } = await api.get("/events");

    expect(status).toEqual(httpStatus.OK);
    expect(body).toHaveLength(2);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          date: expect.any(String),
        }),
      ]),
    );
  });
});
