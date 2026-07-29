import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { PantryImportResponse } from "@/app/lib/pantry-label-import";

function createStubDraft(): PantryImportResponse {
  return {
    draft: {
      name: "Organic rolled oats",
      brand: "North Mill",
      servingSize: "1/2 cup (40g)",
      servingsPerContainer: "8",
      calories: "150",
      totalFat: "3",
      saturatedFat: "0.5",
      transFat: "0",
      polyunsaturatedFat: "1",
      monounsaturatedFat: "1",
      cholesterolMg: "0",
      sodiumMg: "0",
      totalCarbohydrate: "27",
      dietaryFiber: "4",
      totalSugars: "1",
      addedSugars: "0",
      protein: "5",
      vitaminDMcg: "0",
      calciumMg: "20",
      ironMg: "1.6",
      potassiumMg: "150",
    },
    warnings: [
      "Stub response: this draft is mocked until the OpenAI Vision step is connected.",
      "Review serving size and micronutrients before saving.",
    ],
  };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "You must be signed in to import a nutrition label." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "A prepared label image is required." },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "The uploaded file must be an image." },
      { status: 400 },
    );
  }

  if (image.size > 1024 * 1024) {
    return NextResponse.json(
      { error: "The prepared image is unexpectedly large. Please crop again." },
      { status: 400 },
    );
  }

  await image.arrayBuffer();

  return NextResponse.json(createStubDraft());
}
