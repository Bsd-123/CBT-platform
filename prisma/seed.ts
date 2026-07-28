import { PrismaClient, type MaterialTypeKey } from "@prisma/client";
import { bootstrapAdmins } from "./admin-bootstrap";

const prisma = new PrismaClient();

const MATERIAL_TYPES: ReadonlyArray<{
  key: MaterialTypeKey;
  label: string;
  icon: string | null;
}> = [
  { key: "game", label: "משחק", icon: null },
  { key: "reading", label: "קריאה", icon: null },
  { key: "worksheet", label: "דף עבודה", icon: null },
  { key: "treatment_plan", label: "תוכנית טיפול", icon: null },
  { key: "presentation", label: "מצגת", icon: null },
  { key: "video", label: "וידאו", icon: null },
];

const TAGS: ReadonlyArray<{ name: string; color: string }> = [
  { name: "CBT", color: "#6366f1" },
  { name: "חרדה", color: "#ec4899" },
  { name: "ילדים", color: "#14b8a6" },
  { name: "התנהגות", color: "#f59e0b" },
  { name: "דיכאון", color: "#8b5cf6" },
  { name: "הערכה", color: "#ef4444" },
  { name: "הורים", color: "#0ea5e9" },
  { name: "פגיעות", color: "#84cc16" },
];

async function main() {
  for (const materialType of MATERIAL_TYPES) {
    await prisma.materialType.upsert({
      where: { key: materialType.key },
      update: {
        label: materialType.label,
        icon: materialType.icon,
      },
      create: materialType,
    });
  }

  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: { color: tag.color },
      create: tag,
    });
  }

  await bootstrapAdmins(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
