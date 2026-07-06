import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({ adapter });

const builtInTemplates = [
  {
    module: "image.character",
    name: "Character Builder",
    schema: {
      fields: [
        "age",
        "gender",
        "height",
        "hair",
        "eyes",
        "skin",
        "expression",
        "outfit",
        "accessories",
        "lighting",
        "background",
        "views",
        "identityLock",
        "negativePrompt",
      ],
    },
    compilerInstructions:
      "Compile a professional character generation prompt from the given form fields. Preserve identity-lock references verbatim if present.",
  },
  {
    module: "image.location",
    name: "Location Builder",
    schema: {
      fields: ["type", "mood", "weather", "timeOfDay", "messiness", "keyObjects", "lighting", "aspectRatio", "negativePrompt"],
    },
    compilerInstructions: "Compile a professional location/environment generation prompt from the given form fields.",
  },
  {
    module: "image.prop",
    name: "Prop Builder",
    schema: {
      fields: ["category", "material", "era", "condition", "lighting", "background", "negativePrompt"],
    },
    compilerInstructions: "Compile a professional prop generation prompt from the given form fields.",
  },
  {
    module: "image.creature",
    name: "Creature Builder",
    schema: {
      fields: ["speciesBase", "size", "texture", "mood", "environment", "realismLevel", "negativePrompt"],
    },
    compilerInstructions: "Compile a professional creature generation prompt from the given form fields.",
  },
  {
    module: "image.storyboard",
    name: "Storyboard Frames",
    schema: {
      fields: ["sceneDescription", "panelCount", "style", "aspectRatio"],
    },
    compilerInstructions: "Compile a storyboard panel generation prompt from the given form fields.",
  },
];

async function main() {
  for (const template of builtInTemplates) {
    await prisma.promptTemplate.upsert({
      where: { id: template.module },
      update: template,
      create: { id: template.module, ...template, isBuiltIn: true },
    });
  }

  const project = await prisma.project.upsert({
    where: { id: "demo-project" },
    update: {},
    create: {
      id: "demo-project",
      name: "Demo Project",
      description: "Seeded sample project for exploring StudioForge locally.",
    },
  });

  for (const name of ["Characters", "Locations", "Props"]) {
    await prisma.folder.upsert({
      where: { id: `demo-folder-${name.toLowerCase()}` },
      update: {},
      create: {
        id: `demo-folder-${name.toLowerCase()}`,
        name,
        projectId: project.id,
      },
    });
  }

  console.log("Seeded: 5 built-in PromptTemplates, 1 demo project, 3 folders.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
