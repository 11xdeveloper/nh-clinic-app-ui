"use server";

import { db } from "server/db";

export async function findPatient(patientId: string) {
  return await db.patient.findUnique({ where: { id: patientId } });
}
