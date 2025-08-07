import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUnverified: publicProcedure
    .query(async ({ ctx: { db } }) => {
      return await db.user.findMany({
        where: { verified: false },
        orderBy: { id: 'desc' }
      });
    }),

  getAll: publicProcedure
    .query(async ({ ctx: { db } }) => {
      return await db.user.findMany({
        orderBy: { id: 'desc' }
      });
    }),

  verify: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      return await db.user.update({
        where: { id },
        data: { verified: true },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      return await db.user.delete({
        where: { id },
      });
    }),
});
