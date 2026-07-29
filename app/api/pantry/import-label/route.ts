import { NextResponse } from "next/server";
import { extractPantryLabelFromImage } from "@/app/lib/extract-pantry-label-from-image";
import { requireCurrentUserRecord } from "@/app/lib/require-current-user-record";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  let userId: string | null = null;

  let user;

  try {
    user = await requireCurrentUserRecord();
    userId = user.id;
  } catch {
    console.warn("pantry_import_unauthorized", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { error: "You must be signed in to import a nutrition label." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    console.warn("pantry_import_bad_request", {
      requestId,
      userId,
      reason: "missing_image",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: "A prepared label image is required." },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    console.warn("pantry_import_bad_request", {
      requestId,
      userId,
      reason: "invalid_mime_type",
      imageType: image.type,
      imageSizeBytes: image.size,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: "The uploaded file must be an image." },
      { status: 400 },
    );
  }

  if (image.size > 1024 * 1024) {
    console.warn("pantry_import_bad_request", {
      requestId,
      userId,
      reason: "image_too_large",
      imageType: image.type,
      imageSizeBytes: image.size,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: "The prepared image is unexpectedly large. Please crop again." },
      { status: 400 },
    );
  }

  try {
    const result = await extractPantryLabelFromImage(image);

    console.info("pantry_import_success", {
      requestId,
      userId,
      imageType: image.type,
      imageSizeBytes: image.size,
      warningsCount: result.warnings.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't read that label. Please try again.";
    const isMissingApiKey =
      message === "OPENAI_API_KEY is not configured on the server.";
    const status = isMissingApiKey ? 500 : 502;

    console.error("pantry_import_failed", {
      requestId,
      userId,
      imageType: image.type,
      imageSizeBytes: image.size,
      status,
      errorMessage: message,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        error:
          isMissingApiKey
            ? message
            : "We couldn't read that label. Please try again.",
      },
      {
        status,
      },
    );
  }
}
