import { z } from "zod"
import { createTRPCRouter, adminProcedure } from "../trpc"

export const userRouter = createTRPCRouter({
  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      orderBy: { createdAt: "desc" },
    })
  }),

  verify: adminProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.user.update({
      where: { id: input.userId },
      data: { verified: true },
    })
  }),

  delete: adminProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx, input }) => {
    // Delete all sessions for this user first
    await ctx.db.session.deleteMany({
      where: { userId: input.userId },
    })

    // Then delete the user
    return ctx.db.user.delete({
      where: { id: input.userId },
    })
  }),
})
