import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const patientRouter = createTRPCRouter({
  find: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx: { db }, input: { id } }) => {
      return await db.patient.findUnique({ where: { id } });
    }),

  getAll: publicProcedure
    .query(async ({ ctx: { db } }) => {
      return await db.patient.findMany({
        orderBy: { dateLastVisited: 'desc' }
      });
    }),

  create: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      age: z.number(),
      phoneNumber: z.string(),
      cnic: z.string(),
      comments: z.string(),
      dateLastVisited: z.date(),
    }))
    .mutation(async ({ ctx: { db }, input }) => {
      return await db.patient.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      age: z.number(),
      phoneNumber: z.string(),
      cnic: z.string(),
      comments: z.string(),
      dateLastVisited: z.date(),
    }))
    .mutation(async ({ ctx: { db }, input }) => {
      const { id, ...data } = input;
      return await db.patient.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      return await db.patient.delete({
        where: { id },
      });
    }),
});
