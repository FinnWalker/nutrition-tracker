import OpenAI from "openai";
import type { Response as OpenAIResponse } from "openai/resources/responses/responses";
import type {
  PantryImportDraft,
  PantryImportResponse,
} from "@/app/lib/pantry-label-import";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 0,
  timeout: 20000,
});

const OPENAI_LABEL_MODEL = "gpt-5-mini";
const OPENAI_LABEL_MAX_OUTPUT_TOKENS = 1200;

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

const extractedValueFields = [
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
  "saltGrams",
] as const;

const numericDraftFields = [
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

const gramFields = new Set<keyof PantryImportDraft>([
  "totalFat",
  "saturatedFat",
  "transFat",
  "polyunsaturatedFat",
  "monounsaturatedFat",
  "totalCarbohydrate",
  "dietaryFiber",
  "totalSugars",
  "addedSugars",
  "protein",
]);

const milligramFields = new Set<keyof PantryImportDraft>([
  "cholesterolMg",
  "sodiumMg",
  "calciumMg",
  "ironMg",
  "potassiumMg",
]);

type ExtractedValueField = (typeof extractedValueFields)[number];

type NutritionValueRecord = Record<ExtractedValueField, string>;

type PantryLabelDualColumnModelOutput = {
  per100Heading: string;
  perServingHeading: string;
  per100: NutritionValueRecord;
  perServing: NutritionValueRecord;
};

function createEmptyDraft(): PantryImportDraft {
  return Object.fromEntries(
    pantryDraftFields.map((field) => [field, ""]),
  ) as PantryImportDraft;
}

function createSchemaProperties() {
  return Object.fromEntries(
    extractedValueFields.map((field) => [field, { type: "string" }]),
  );
}

function isValueRecord(value: unknown): value is NutritionValueRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return extractedValueFields.every(
    (field) => typeof candidate[field] === "string",
  );
}

function isPantryLabelDualColumnModelOutput(
  value: unknown,
): value is PantryLabelDualColumnModelOutput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.per100Heading !== "string" ||
    typeof candidate.perServingHeading !== "string"
  ) {
    return false;
  }

  return isValueRecord(candidate.per100) && isValueRecord(candidate.perServing);
}

function sanitizeNumericDraftValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const normalized = trimmed
    .replace(/,/g, ".")
    .replace(/\s+/g, "")
    .replace(/^(<|>|~|\u2248)+/, "")
    .match(/-?\d*\.?\d+/)?.[0];

  if (!normalized) {
    return "";
  }

  if (normalized.startsWith(".")) {
    return `0${normalized}`;
  }

  if (normalized.startsWith("-.")) {
    return normalized.replace("-.", "-0.");
  }

  return normalized;
}

function formatNormalizedNumber(value: number) {
  if (Number.isInteger(value)) {
    return `${value}`;
  }

  return value.toFixed(3).replace(/\.?0+$/, "");
}

function extractNumericValueAndUnit(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/,/g, ".");
  const match = normalized.match(
    /^(?:[<>~\u2248]\s*)?(-?\d*\.?\d+)\s*([a-zA-Z\u00B5\u03BC]*)/,
  );

  if (!match) {
    return null;
  }

  const numericValue = Number(match[1]);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const rawUnit = match[2]?.toLowerCase() ?? "";
  const unit =
    rawUnit === "\u03bcg" || rawUnit === "\u00b5g"
      ? "mcg"
      : rawUnit === "ug"
        ? "mcg"
        : rawUnit;

  return {
    numericValue,
    unit,
  };
}

function extractEnergyValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const kcalMatch = trimmed.match(/(-?\d*\.?\d+)\s*kcal\b/i);

  if (kcalMatch) {
    return sanitizeNumericDraftValue(kcalMatch[1]);
  }

  const kjAndKcalMatch = trimmed.match(
    /\b(-?\d*\.?\d+)\s*kj\b.*?\b(-?\d*\.?\d+)\s*kcal\b/i,
  );

  if (kjAndKcalMatch) {
    return sanitizeNumericDraftValue(kjAndKcalMatch[2]);
  }

  return sanitizeNumericDraftValue(trimmed);
}

function normalizeNumericFieldValue(
  field: keyof PantryImportDraft,
  value: string,
) {
  if (field === "calories") {
    return extractEnergyValue(value);
  }

  const parsed = extractNumericValueAndUnit(value);

  if (!parsed) {
    return "";
  }

  const { numericValue, unit } = parsed;

  if (gramFields.has(field)) {
    if (unit === "mg") {
      return formatNormalizedNumber(numericValue / 1000);
    }

    if (unit === "mcg") {
      return formatNormalizedNumber(numericValue / 1_000_000);
    }

    return formatNormalizedNumber(numericValue);
  }

  if (milligramFields.has(field)) {
    if (unit === "g") {
      return formatNormalizedNumber(numericValue * 1000);
    }

    if (unit === "mcg") {
      return formatNormalizedNumber(numericValue / 1000);
    }

    return formatNormalizedNumber(numericValue);
  }

  if (field === "vitaminDMcg") {
    if (unit === "g") {
      return formatNormalizedNumber(numericValue * 1_000_000);
    }

    if (unit === "mg") {
      return formatNormalizedNumber(numericValue * 1000);
    }

    return formatNormalizedNumber(numericValue);
  }

  return sanitizeNumericDraftValue(value);
}

function sanitizeNumericDraftFields(draft: PantryImportDraft) {
  for (const field of numericDraftFields) {
    draft[field] = normalizeNumericFieldValue(field, draft[field]);
  }
}

function normalizeColumnHeading(heading: string) {
  return heading.trim().replace(/\s+/g, " ");
}

function formatAmountUnit(value: string, unit: string) {
  const formattedValue = value.replace(",", ".");
  const normalizedUnit = unit.toLowerCase();

  if (
    normalizedUnit === "ml" ||
    normalizedUnit === "mg" ||
    normalizedUnit === "mcg"
  ) {
    return `${formattedValue} ${normalizedUnit}`;
  }

  if (
    normalizedUnit === "l" ||
    normalizedUnit === "g" ||
    normalizedUnit === "kg"
  ) {
    return `${formattedValue} ${normalizedUnit}`;
  }

  return `${formattedValue} ${unit}`;
}

function inferServingSizeFromHeading(heading: string) {
  const normalized = normalizeColumnHeading(heading);

  if (!normalized) {
    return "";
  }

  const amountMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\b/i);

  if (amountMatch) {
    return formatAmountUnit(amountMatch[1], amountMatch[2]);
  }

  return normalized
    .replace(/^(per|for)\s+/i, "")
    .replace(/\b(serving|portion)\b/gi, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveSodiumFromSalt(rawSaltValue: string) {
  const parsedSalt = extractNumericValueAndUnit(rawSaltValue);

  if (!parsedSalt) {
    return "";
  }

  const { numericValue, unit } = parsedSalt;

  let saltGrams = numericValue;

  if (unit === "mg") {
    saltGrams = numericValue / 1000;
  } else if (unit === "mcg") {
    saltGrams = numericValue / 1_000_000;
  }

  if (!Number.isFinite(saltGrams) || saltGrams < 0) {
    return "";
  }

  return `${Math.round(saltGrams * 393.4)}`;
}

function shouldDeriveSodiumFromSalt(sodiumMg: string, saltGrams: string) {
  const parsedSalt = extractNumericValueAndUnit(saltGrams);

  if (!parsedSalt) {
    return false;
  }

  let saltGramsValue = parsedSalt.numericValue;

  if (parsedSalt.unit === "mg") {
    saltGramsValue /= 1000;
  } else if (parsedSalt.unit === "mcg") {
    saltGramsValue /= 1_000_000;
  }

  if (!Number.isFinite(saltGramsValue) || saltGramsValue <= 0) {
    return false;
  }

  const parsedSodium = extractNumericValueAndUnit(sodiumMg);

  if (!parsedSodium) {
    return true;
  }

  if (parsedSodium.unit === "g") {
    return true;
  }

  if (parsedSodium.unit === "mg" || parsedSodium.unit === "") {
    return parsedSodium.numericValue === 0;
  }

  return false;
}

function dedupeWarnings(warnings: string[]) {
  return [
    ...new Set(warnings.map((warning) => warning.trim()).filter(Boolean)),
  ];
}

function hasAnyNonEmptyValue(record: NutritionValueRecord) {
  return extractedValueFields.some((field) => record[field].trim() !== "");
}

function normalizeModelOutput(
  value: PantryLabelDualColumnModelOutput,
): PantryImportResponse {
  const perServingHeading = normalizeColumnHeading(value.perServingHeading);
  const per100Heading = normalizeColumnHeading(value.per100Heading);
  const usePerServing =
    perServingHeading && hasAnyNonEmptyValue(value.perServing);
  const selectedColumnHeading = usePerServing
    ? perServingHeading
    : per100Heading;
  const selectedValues = usePerServing ? value.perServing : value.per100;

  const draft = createEmptyDraft();
  draft.servingSize = inferServingSizeFromHeading(selectedColumnHeading);

  for (const field of extractedValueFields) {
    if (field === "saltGrams") {
      continue;
    }

    draft[field] = selectedValues[field].trim();
  }

  sanitizeNumericDraftFields(draft);

  const warnings: string[] = [];

  if (selectedColumnHeading) {
    warnings.push(
      `Values were imported from the ${selectedColumnHeading} column.`,
    );
  }

  if (shouldDeriveSodiumFromSalt(draft.sodiumMg, selectedValues.saltGrams)) {
    const sodiumMg = deriveSodiumFromSalt(selectedValues.saltGrams);

    if (sodiumMg) {
      draft.sodiumMg = sodiumMg;
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
    warnings: dedupeWarnings(warnings),
  };
}

function extractResponseRefusal(response: OpenAIResponse) {
  for (const outputItem of response.output) {
    if (outputItem.type !== "message") {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (contentItem.type === "refusal") {
        return contentItem.refusal.trim();
      }
    }
  }

  return "";
}

function describeEmptyResponse(response: OpenAIResponse) {
  const refusal = extractResponseRefusal(response);

  if (refusal) {
    return `OpenAI refused the label extraction request: ${refusal}`;
  }

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason ?? "unknown_reason";
    return `OpenAI returned an incomplete label extraction response (${reason}).`;
  }

  if (response.status === "failed") {
    return "OpenAI failed to complete the label extraction response.";
  }

  return "OpenAI returned an empty label extraction response.";
}

export async function extractPantryLabelFromImage(image: File) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const base64Image = Buffer.from(await image.arrayBuffer()).toString("base64");
  const imageUrl = `data:${image.type};base64,${base64Image}`;

  const response = await openai.responses.create({
    model: OPENAI_LABEL_MODEL,
    reasoning: {
      effort: "minimal",
    },
    max_output_tokens: OPENAI_LABEL_MAX_OUTPUT_TOKENS,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Extract up to two nutrition columns from the cropped nutrition panel only: one per-100 column and one serving or portion column. " +
              "If a column is missing, return an empty heading and empty values for that column. " +
              "Use empty strings for missing or unreadable cells. " +
              "Do not include per-column wording inside the cell value if it only comes from the heading. " +
              "Do not add warnings, explanations, or inferred values.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Return JSON only with these keys: per100Heading, perServingHeading, per100, perServing. Inside per100 and perServing include only: calories, totalFat, saturatedFat, transFat, polyunsaturatedFat, monounsaturatedFat, cholesterolMg, sodiumMg, totalCarbohydrate, dietaryFiber, totalSugars, addedSugars, protein, vitaminDMcg, calciumMg, ironMg, potassiumMg, saltGrams.",
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "pantry_label_table_import",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            per100Heading: {
              type: "string",
            },
            perServingHeading: {
              type: "string",
            },
            per100: {
              type: "object",
              additionalProperties: false,
              properties: createSchemaProperties(),
              required: [...extractedValueFields],
            },
            perServing: {
              type: "object",
              additionalProperties: false,
              properties: createSchemaProperties(),
              required: [...extractedValueFields],
            },
          },
          required: [
            "per100Heading",
            "perServingHeading",
            "per100",
            "perServing",
          ],
        },
      },
    },
  });

  const outputText = response.output_text.trim();

  if (!outputText) {
    console.error("pantry_label_extraction_empty_response", {
      responseId: response.id,
      model: OPENAI_LABEL_MODEL,
      status: response.status,
      incompleteDetails: response.incomplete_details,
      usage: response.usage,
      outputItemTypes: response.output.map((outputItem) => outputItem.type),
    });

    throw new Error(describeEmptyResponse(response));
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI returned invalid JSON for the label extraction.");
  }

  if (!isPantryLabelDualColumnModelOutput(parsed)) {
    throw new Error("OpenAI returned an unexpected label extraction shape.");
  }

  const normalized = normalizeModelOutput(parsed);

  console.info("pantry_label_extraction_payload", {
    raw: parsed,
    normalized,
    usage: response.usage,
  });

  return normalized;
}
