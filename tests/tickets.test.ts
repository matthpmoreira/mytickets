import httpStatus from "http-status";
import supertest from "supertest";
import prisma from "database";
import { app } from "index";
import { faker } from "@faker-js/faker/.";
import { EventFactory, TicketFactory } from "./factories";

const api = supertest(app);

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.ticket.deleteMany();
});

describe("GET /tickets/:id", () => {
  it("should get an array of tickets for an event", async () => {
    const { id: eventId } = await prisma.event.create({ data: EventFactory() });
    const tickets = Array.from({ length: 3 }, () => TicketFactory({ eventId }));
    await prisma.ticket.createMany({ data: tickets });

    const { status, body } = await api.get("/tickets/" + eventId);

    expect(status).toEqual(httpStatus.OK);
    expect(body).toHaveLength(3);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          owner: expect.any(String),
          code: expect.any(String),
          used: expect.any(Boolean),
          eventId: expect.any(Number),
        }),
      ]),
    );
  });

  it("should fail if event ID is invalid", async () => {
    const { status } = await api.get("/tickets/0");
    expect(status).toEqual(httpStatus.BAD_REQUEST);
  });
});

describe("POST /tickets", () => {
  it("should create a ticket", async () => {
    const { id: eventId } = await prisma.event.create({ data: EventFactory() });
    const ticket = TicketFactory({ eventId });

    const { status, body } = await api.post("/tickets").send(ticket);
    const { id, ...response } = body;

    expect(status).toEqual(httpStatus.CREATED);
    expect(response).toEqual({ used: false, ...ticket });
  });

  it("should fail if a field is invalid", async () => {
    const tickets = [
      TicketFactory({ code: "" }),
      TicketFactory({ owner: "" }),
      TicketFactory({ eventId: 0 }),
    ];

    const status = await Promise.all(
      tickets.map((ticket) =>
        api
          .post("/tickets")
          .send(ticket)
          .then((res) => res.status),
      ),
    );

    expect(status).toEqual(
      expect.arrayContaining([httpStatus.UNPROCESSABLE_ENTITY]),
    );
  });

  it("should fail if already registered", async () => {
    const { id: eventId } = await prisma.event.create({ data: EventFactory() });
    const ticket = TicketFactory({ eventId });
    await prisma.ticket.create({ data: ticket });

    const { status } = await api.post("/tickets").send(ticket);

    expect(status).toEqual(httpStatus.CONFLICT);
  });

  it("should fail if event expired", async () => {
    const event = EventFactory({ date: faker.date.past() });
    const { id: eventId } = await prisma.event.create({ data: event });
    const ticket = TicketFactory({ eventId });

    const { status } = await api.post("/tickets").send(ticket);

    expect(status).toEqual(httpStatus.FORBIDDEN);
  });

  it("should fail if event not found", async () => {
    const ticket = TicketFactory();
    const { status } = await api.post("/tickets").send(ticket);

    expect(status).toEqual(httpStatus.NOT_FOUND);
  });
});

describe("PUT /events/use/:id", () => {
  it("should set a ticket as used", async () => {
    const { id: eventId } = await prisma.event.create({ data: EventFactory() });
    const ticket = TicketFactory({ eventId });
    const { id } = await prisma.ticket.create({ data: ticket });

    const { status } = await api.put("/tickets/use/" + id).send();
    const dbEntry = await prisma.ticket.findUnique({ where: { id } });

    expect(status).toEqual(httpStatus.NO_CONTENT);
    expect(dbEntry.used).toEqual(true);
  });

  it("should fail if ID is invalid", async () => {
    const { status } = await api.put("/tickets/use/0").send();
    expect(status).toEqual(httpStatus.BAD_REQUEST);
  });

  it("should fail if event is expired", async () => {
    const event = EventFactory({ date: faker.date.past() });
    const { id: eventId } = await prisma.event.create({ data: event });
    const ticket = TicketFactory({ eventId });
    const { id } = await prisma.ticket.create({ data: ticket });

    const { status } = await api.put("/tickets/use/" + id).send();

    expect(status).toEqual(httpStatus.FORBIDDEN);
  });

  it("should fail if ticket is used", async () => {
    const { id: eventId } = await prisma.event.create({ data: EventFactory() });
    const ticket = TicketFactory({ eventId });
    const { id } = await prisma.ticket.create({ data: ticket });
    await prisma.ticket.update({ data: { used: true }, where: { id } });

    const { status } = await api.put("/tickets/use/" + id).send();

    expect(status).toEqual(httpStatus.FORBIDDEN);
  });
});
