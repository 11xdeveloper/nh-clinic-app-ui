import z from "zod";
import { createTRPCRouter, authedProcedure } from "../trpc";

export const patientRouter = createTRPCRouter({
  find: authedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx: { db }, input: { id } }) => {
      return await db.patient.findUnique({ where: { id } });
    }),

  getAll: authedProcedure.query(async ({ ctx: { db } }) => {
    return await db.patient.findMany({
      orderBy: { dateLastVisited: "desc" },
    });
  }),

  create: authedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
        phoneNumber: z.string(),
        cnic: z.string(),
        comments: z.string(),
        dateLastVisited: z.date(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      return await db.patient.create({
        data: input,
      });
    }),

  update: authedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
        phoneNumber: z.string(),
        cnic: z.string(),
        comments: z.string(),
        dateLastVisited: z.date(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { id, ...data } = input;
      return await db.patient.update({
        where: { id },
        data,
      });
    }),

  delete: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      return await db.patient.delete({
        where: { id },
      });
    }),


  // MY ADDITIONS - no changes to any previous code
  recordVisit: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      const patient = await db.patient.findUnique({ where: { id } });

      if (!patient) throw new Error("Patient not found");
      if (patient.isBlocked) throw new Error("Card is blocked. Verification required.");

      const newVisitCount = patient.currentCycleVisits + 1;
      const shouldBlock = newVisitCount >= 6;

      return await db.$transaction([
        db.visit.create({
          data: {
            patientId: id,
            dateTime: new Date(),
          },
        }),
        db.patient.update({
          where: { id },
          data: {
            currentCycleVisits: newVisitCount,
            isBlocked: shouldBlock,
            dateLastVisited: new Date(),
          },
        }),
      ]);
    }),

  reverify: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      return await db.patient.update({
        where: { id },
        data: {
          isBlocked: false,
          currentCycleVisits: 0,
        },
      });
    }),

});
