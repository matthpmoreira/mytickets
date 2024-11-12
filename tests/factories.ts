import { Event, Ticket } from "@prisma/client";
import { faker } from "@faker-js/faker";

export function EventFactory(data?: Partial<Omit<Event, "id">>): {
  name: string;
  date: string;
} {
  return {
    name: data?.name ?? faker.word.words(5),
    date: (data?.date ?? faker.date.future()).toISOString(),
  };
}

export function TicketFactory(data?: Partial<Omit<Ticket, "id">>): {
  owner: string;
  code: string;
  eventId: number;
} {
  return {
    owner: data?.owner ?? faker.person.fullName(),
    code: data?.code ?? String(faker.number.int()),
    eventId: data?.eventId ?? 1,
  };
}
