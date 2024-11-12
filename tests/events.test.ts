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

describe("GET /events/:id", () => {
  it("should get a single event", async () => {
    const { id } = await prisma.event.create({ data: EventFactory() });
    const { status, body } = await api.get("/events/" + id);

    expect(status).toEqual(httpStatus.OK);
    expect(body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        date: expect.any(String),
      }),
    );
  });

  it("should fail if ID is invalid", async () => {
    const { status } = await api.get("/events/0");
    expect(status).toEqual(httpStatus.BAD_REQUEST);
  });

  it("should fail if event does not exist", async () => {
    const { status } = await api.get("/events/1");
    expect(status).toEqual(httpStatus.NOT_FOUND);
  });
});
