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
