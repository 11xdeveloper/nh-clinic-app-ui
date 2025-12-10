import { PrismaClient, type Patient } from "@prisma/client";

const prisma = new PrismaClient();

const mockPatients: Patient[] = [
  {
    id: "9781108859035",
    cardNumber: 1,
    name: "Ahmed Hassan",
    age: 45,
    phoneNumber: "+92-300-1234567",
    cnic: "42101-1234567-1",
    dateLastVisited: new Date("2025-07-28"),
    comments:
      "Regular checkup completed. Blood pressure normal. Next visit in 3 months.",
    isBlocked: false,
    currentCycleVisits: 0,
  },
  {
    id: "9781108733755",
    cardNumber: 2,
    name: "Fatima Khan",
    age: 32,
    phoneNumber: "+92-301-9876543",
    cnic: "42201-9876543-2",
    dateLastVisited: new Date("2024-01-10"),
    comments:
      "Diabetes follow-up. Medication adjusted. Diet counseling provided.",
    isBlocked: false,
    currentCycleVisits: 0,
  },
  {
    id: "PAT003",
    cardNumber: 3,
    name: "Muhammad Ali",
    age: 28,
    phoneNumber: "+92-302-5555555",
    cnic: "42301-5555555-3",
    dateLastVisited: new Date("2024-01-08"),
    comments:
      "First visit. General health screening completed. All vitals normal.",
    isBlocked: false,
    currentCycleVisits: 0,
  },
  {
    id: "PAT004",
    cardNumber: 4,
    name: "Aisha Malik",
    age: 55,
    phoneNumber: "+92-303-7777777",
    cnic: "42401-7777777-4",
    dateLastVisited: new Date("2024-01-12"),
    comments:
      "Hypertension management. Prescribed new medication. Follow-up in 2 weeks.",
    isBlocked: false,
    currentCycleVisits: 0,
  },
  {
    id: "PAT005",
    cardNumber: 5,
    name: "Omar Sheikh",
    age: 38,
    phoneNumber: "+92-304-9999999",
    cnic: "42501-9999999-5",
    dateLastVisited: new Date("2024-01-14"),
    comments: "Routine vaccination completed. Health education provided.",
    isBlocked: false,
    currentCycleVisits: 0,
  },
];

for (const patient of mockPatients) {
  await prisma.patient.create({
    data: {
      ...patient,
      visits: {
        create: {
          dateTime: patient.dateLastVisited,
        },
      },
    },
  });
}

prisma.$disconnect();

console.log("Database has been seeded with mock data!");
