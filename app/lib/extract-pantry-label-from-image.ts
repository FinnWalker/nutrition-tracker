import OpenAI from "openai";
import type {
  PantryImportDraft,
  PantryImportResponse,
} from "@/app/lib/pantry-label-import";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 0,
  timeout: 20000,
});

const pantryDraftFields = [
  "name",
  "brand",
  "servingSize",
  "servingsPerContainer",
  "calories",
  "totalFat",
  "saturatedFat",
  "transFat",
  "polyunsaturatedFat",
  "monounsaturatedFat",
  "cholesterolMg",
  "sodiumMg",
  "totalCarbohydrate",
  "dietaryFiber",
  "totalSugars",
  "addedSugars",
  "protein",
  "vitaminDMcg",
  "calciumMg",
  "ironMg",
  "potassiumMg",
] as const satisfies ReadonlyArray<keyof PantryImportDraft>;

type PantryLabelModelOutput = PantryImportDraft & {
  saltGrams: string;
  warnings: string[];
};

function createSchemaProperties() {
  return Object.fromEntries(
    pantryDraftFields.map((field) => [field, { type: "string" }]),
  );
}

function isPantryLabelModelOutput(value: unknown): value is PantryLabelModelOutput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    !Array.isArray(candidate.warnings) ||
    candidate.warnings.some((warning) => typeof warning !== "string")
  ) {
    return false;
  }

  return (
    typeof candidate.saltGrams === "string" &&
    pantryDraftFields.every((field) => typeof candidate[field] === "string")
  );
}

function normalizeModelOutput(value: PantryLabelModelOutput): PantryImportResponse {
  const draft = Object.fromEntries(
    pantryDraftFields.map((field) => [field, value[field].trim()]),
  ) as PantryImportDraft;
  const warnings = value.warnings.map((warning) => warning.trim()).filter(Boolean);

  // Product identity is expected to be entered manually outside the nutrition panel.
  draft.name = "";
  draft.brand = "";
  draft.servingsPerContainer = "";

  if (!draft.sodiumMg) {
    const normalizedSalt = value.saltGrams.trim().replace(",", ".");
    const saltGrams = Number(normalizedSalt);

    if (Number.isFinite(saltGrams) && saltGrams >= 0) {
      const sodiumMg = Math.round(saltGrams * 393.4);
      draft.sodiumMg = `${sodiumMg}`;
      warnings.push(
        "Sodium was derived from the listed salt value using 1 g salt = 393 mg sodium.",
      );
    }
  }

  warnings.push(
    "Enter the product name, brand, and servings per container manually.",
  );

  return {
    draft,
    warnings,
  };
}

export async function extractPantryLabelFromImage(image: File) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
  const imageUrl = `data:${image.type};base64,${base64Image}`;

  const response = await openai.responses.create({
    model: "gpt-5.6",
    max_output_tokens: 500,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You extract nutrition labels into a strict JSON object for a pantry form. " +
              "Only use values visible in the provided image. Use empty strings for unknown fields. " +
              "This crop is expected to contain only the nutrition panel, so leave name, brand, and servingsPerContainer empty. " +
              "Map 'fibre' to dietaryFiber, 'carbohydrate' or 'carbohydrates' to totalCarbohydrate, and 'of which sugars' to totalSugars. " +
              "If sodium is not listed but salt is listed, put the salt amount in saltGrams and leave sodiumMg empty. " +
              "Do not invent product names, brands, serving sizes, or nutrients. " +
              "Put any uncertainty, ambiguity, or missing-label notes into warnings.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Read this cropped nutrition label image and return the pantry draft. " +
              "All nutrient number fields must be strings, not numbers. " +
              "Leave name, brand, and servingsPerContainer as empty strings unless those exact values are explicitly visible in the crop. " +
              "Treat 'fibre' as dietaryFiber, 'carbohydrate' or 'carbohydrates' as totalCarbohydrate, and 'of which sugars' as totalSugars. " +
              "If the label uses salt instead of sodium, copy the salt amount in grams into saltGrams. " +
              "Warnings should be concise and only mention uncertainty or missing data.",
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "auto",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "pantry_label_import",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            ...createSchemaProperties(),
            saltGrams: {
              type: "string",
            },
            warnings: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: [...pantryDraftFields, "saltGrams", "warnings"],
        },
      },
    },
  });

  if (!response.output_text) {
    throw new Error("OpenAI returned an empty label extraction response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    throw new Error("OpenAI returned invalid JSON for the label extraction.");
  }

  if (!isPantryLabelModelOutput(parsed)) {
    throw new Error("OpenAI returned an unexpected label extraction shape.");
  }

  return normalizeModelOutput(parsed);
}
