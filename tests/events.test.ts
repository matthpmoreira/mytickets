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

describe("POST /events", () => {
  it("should create a event", async () => {
    const event = EventFactory();
    const { status, body } = await api.post("/events").send(event);
    const { id, ...response } = body;

    expect(status).toEqual(httpStatus.CREATED);
    expect(response).toEqual(event);
  });

  it("should fail if a field is invalid", async () => {
    const events = [EventFactory({ name: "" }), EventFactory({ date: null })];

    const status = await Promise.all(
      events.map((event) =>
        api
          .post("/events")
          .send(event)
          .then((res) => res.status),
      ),
    );

    expect(status).toEqual(
      expect.arrayContaining([httpStatus.UNPROCESSABLE_ENTITY]),
    );
  });

  it("should fail if already registered", async () => {
    const event = EventFactory();
    await prisma.event.create({ data: event });

    const { status } = await api.post("/events").send(event);

    expect(status).toEqual(httpStatus.CONFLICT);
  });
});

describe("PUT /events/:id", () => {
  it("should edit an event", async () => {
    const event = EventFactory();
    const edited = EventFactory();
    const { id } = await prisma.event.create({ data: event });

    const { status, body } = await api.put("/events/" + id).send(edited);

    expect(status).toEqual(httpStatus.OK);
    expect(body).toEqual({ id, ...edited });
  });

  it("should fail if already registered", async () => {
    const events = [EventFactory(), EventFactory()];
    const created = await Promise.all(
      events.map((data) => prisma.event.create({ data })),
    );
    const { id, ...edited } = created[1];

    const { status } = await api.put("/events/" + created[0].id).send(edited);

    expect(status).toEqual(httpStatus.CONFLICT);
  });

  it("should fail if ID is invalid", async () => {
    const event = EventFactory();
    const { status } = await api.put("/events/0").send(event);

    expect(status).toEqual(httpStatus.BAD_REQUEST);
  });

  it("should fail if event does not exist", async () => {
    const event = EventFactory();
    const { status } = await api.get("/events/1").send(event);

    expect(status).toEqual(httpStatus.NOT_FOUND);
  });
});
