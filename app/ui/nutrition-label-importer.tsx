"use client";

import type { ChangeEvent } from "react";
import imageCompression from "browser-image-compression";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  cropToCanvas,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";

type CropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PreparedNutritionLabelImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  crop: CropRect;
};

type NutritionLabelImporterProps = {
  disabled: boolean;
  onPrepared: (image: PreparedNutritionLabelImage) => void;
};

const DEFAULT_CROP_WIDTH_PERCENT = 72;
const MAX_OUTPUT_DIMENSION = 900;
const OUTPUT_QUALITY = 0.82;
const MAX_OUTPUT_SIZE_MB = 0.35;
const ROTATION_STEP_DEGREES = 90;

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

function revokePreviewUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The selected image could not be read."));
    };

    reader.onerror = () => {
      reject(new Error("The selected image could not be read."));
    };

    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("The selected image could not be loaded."));
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("The cropped image could not be prepared."));
      },
      type,
      quality,
    );
  });
}

function createCenteredCrop(width: number, height: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: DEFAULT_CROP_WIDTH_PERCENT,
      },
      width / height,
      width,
      height,
    ),
    width,
    height,
  );
}

function toCropRect(crop: PixelCrop, width: number, height: number): CropRect {
  return {
    left: Number(((crop.x / width) * 100).toFixed(2)),
    top: Number(((crop.y / height) * 100).toFixed(2)),
    width: Number(((crop.width / width) * 100).toFixed(2)),
    height: Number(((crop.height / height) * 100).toFixed(2)),
  };
}

async function rotateImageSource(src: string, rotationDegrees: number) {
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;
  const sourceImage = await loadImage(src);

  if (normalizedRotation === 0) {
    return {
      sourceImageUrl: src,
      width: sourceImage.naturalWidth,
      height: sourceImage.naturalHeight,
    };
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image rotation is not available in this browser.");
  }

  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;
  canvas.width = isQuarterTurn
    ? sourceImage.naturalHeight
    : sourceImage.naturalWidth;
  canvas.height = isQuarterTurn
    ? sourceImage.naturalWidth
    : sourceImage.naturalHeight;

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((normalizedRotation * Math.PI) / 180);
  context.drawImage(
    sourceImage,
    -sourceImage.naturalWidth / 2,
    -sourceImage.naturalHeight / 2,
  );

  return {
    sourceImageUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

export default function NutritionLabelImporter({
  disabled,
  onPrepared,
}: NutritionLabelImporterProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const preparedPreviewUrlRef = useRef<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourceDimensions, setSourceDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      revokePreviewUrl(preparedPreviewUrlRef.current);
    };
  }, []);

  function clearSourceImage() {
    setSelectedFileName(null);
    setOriginalImageUrl(null);
    setSourceImageUrl(null);
    setSourceDimensions(null);
    setRotationDegrees(0);
    setCrop(undefined);
    setCompletedCrop(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError(null);
    setIsPreparing(false);
    setIsRotating(false);

    try {
      const nextOriginalImageUrl = await readFileAsDataUrl(file);
      const rotatedImage = await rotateImageSource(nextOriginalImageUrl, 0);
      const nextCrop = createCenteredCrop(
        rotatedImage.width,
        rotatedImage.height,
      );

      setSelectedFileName(file.name);
      setOriginalImageUrl(nextOriginalImageUrl);
      setSourceImageUrl(rotatedImage.sourceImageUrl);
      setSourceDimensions({
        width: rotatedImage.width,
        height: rotatedImage.height,
      });
      setRotationDegrees(0);
      setCrop(nextCrop);
      setCompletedCrop(
        convertToPixelCrop(nextCrop, rotatedImage.width, rotatedImage.height),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "The selected image could not be opened.";
      clearSourceImage();
      setError(message);
    }
  }

  function resetCrop() {
    if (!sourceDimensions) {
      return;
    }

    const nextCrop = createCenteredCrop(
      sourceDimensions.width,
      sourceDimensions.height,
    );

    setCrop(nextCrop);
    setCompletedCrop(
      convertToPixelCrop(
        nextCrop,
        sourceDimensions.width,
        sourceDimensions.height,
      ),
    );
  }

  async function handleRotateImage(rotationDelta: number) {
    if (!originalImageUrl || disabled || isPreparing) {
      return;
    }

    setIsRotating(true);
    setError(null);

    try {
      const nextRotationDegrees =
        (((rotationDegrees + rotationDelta) % 360) + 360) % 360;
      const rotatedImage = await rotateImageSource(
        originalImageUrl,
        nextRotationDegrees,
      );
      const nextCrop = createCenteredCrop(
        rotatedImage.width,
        rotatedImage.height,
      );

      setRotationDegrees(nextRotationDegrees);
      setSourceImageUrl(rotatedImage.sourceImageUrl);
      setSourceDimensions({
        width: rotatedImage.width,
        height: rotatedImage.height,
      });
      setCrop(nextCrop);
      setCompletedCrop(
        convertToPixelCrop(nextCrop, rotatedImage.width, rotatedImage.height),
      );
    } catch (rotationError) {
      setError(
        rotationError instanceof Error
          ? rotationError.message
          : "The selected image could not be rotated.",
      );
    } finally {
      setIsRotating(false);
    }
  }

  async function handlePrepareImage() {
    if (
      !sourceDimensions ||
      !completedCrop ||
      !imageRef.current ||
      disabled ||
      isRotating
    ) {
      return;
    }

    setIsPreparing(true);
    setError(null);

    try {
      const sourceCanvas = document.createElement("canvas");
      const cropWidth = Math.max(1, Math.round(completedCrop.width));
      const cropHeight = Math.max(1, Math.round(completedCrop.height));

      sourceCanvas.width = cropWidth;
      sourceCanvas.height = cropHeight;

      const context = sourceCanvas.getContext("2d");

      if (!context) {
        throw new Error("Image processing is not available in this browser.");
      }

      await cropToCanvas(imageRef.current, sourceCanvas, completedCrop);

      const croppedBlob = await canvasToBlob(
        sourceCanvas,
        "image/jpeg",
        OUTPUT_QUALITY,
      );
      const fileBaseName =
        selectedFileName?.replace(/\.[^/.]+$/, "") ?? "nutrition-label";
      const croppedFile = new File([croppedBlob], `${fileBaseName}-crop.jpg`, {
        type: "image/jpeg",
      });

      const compressedFile = await imageCompression(croppedFile, {
        maxSizeMB: MAX_OUTPUT_SIZE_MB,
        maxWidthOrHeight: MAX_OUTPUT_DIMENSION,
        initialQuality: OUTPUT_QUALITY,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const compressedImageUrl = await readFileAsDataUrl(compressedFile);
      const compressedImage = await loadImage(compressedImageUrl);

      revokePreviewUrl(preparedPreviewUrlRef.current);

      const previewUrl = URL.createObjectURL(compressedFile);
      preparedPreviewUrlRef.current = previewUrl;

      onPrepared({
        file: compressedFile,
        previewUrl,
        width: compressedImage.naturalWidth,
        height: compressedImage.naturalHeight,
        sizeBytes: compressedFile.size,
        mimeType: compressedFile.type,
        crop: toCropRect(
          completedCrop,
          sourceDimensions.width,
          sourceDimensions.height,
        ),
      });
    } catch (prepareError) {
      const message =
        prepareError instanceof Error
          ? prepareError.message
          : "The cropped image could not be prepared.";
      setError(message);
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <section className="border border-border bg-background p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
            Label import
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            Upload and crop a nutrition label
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted">
            Choose a package photo, drag the crop corners around the nutrition
            panel, and we will prepare a smaller image for the later AI
            extraction step.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer bg-brand px-4 py-2 text-sm text-white">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              disabled={disabled || isPreparing || isRotating}
              onChange={handleFileChange}
              className="sr-only"
            />
            Choose image
          </label>
          <button
            type="button"
            onClick={clearSourceImage}
            disabled={disabled || !sourceImageUrl || isPreparing || isRotating}
            className="border border-border px-4 py-2 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {!sourceImageUrl ? (
        <div className="mt-6 border border-dashed border-border bg-surface p-6 text-sm leading-7 text-foreground-muted">
          Upload a phone photo or screenshot of a nutrition label to begin.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden border border-border bg-surface">
              <div className="border-b border-border px-4 py-3 text-sm text-foreground-muted">
                {selectedFileName}
                {sourceDimensions
                  ? ` | ${sourceDimensions.width} x ${sourceDimensions.height}`
                  : ""}
              </div>
              <div className="overflow-auto p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  keepSelection
                  minWidth={120}
                  minHeight={120}
                  ruleOfThirds
                  className="inline-block max-w-full bg-surface-elevated align-top"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={sourceImageUrl}
                    alt="Selected nutrition label"
                    className="block h-auto max-h-[70vh] w-auto max-w-full"
                  />
                </ReactCrop>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-border bg-surface p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                Crop selection
              </p>
              <div className="mt-4 space-y-2 text-sm text-foreground-muted">
                <p>Drag inside the box to move it.</p>
                <p>Drag the corners or edges to tighten the selection.</p>
                <p>Keep only the nutrition panel in frame for the best OCR.</p>
                <p>Rotate first if your phone photo was taken sideways.</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleRotateImage(-ROTATION_STEP_DEGREES)}
                  disabled={
                    disabled || isPreparing || isRotating || !originalImageUrl
                  }
                  className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Rotate left
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateImage(ROTATION_STEP_DEGREES)}
                  disabled={
                    disabled || isPreparing || isRotating || !originalImageUrl
                  }
                  className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm"
                >
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  Rotate right
                </button>
                <button
                  type="button"
                  onClick={resetCrop}
                  disabled={
                    disabled || isPreparing || isRotating || !sourceDimensions
                  }
                  className="border border-border px-4 py-2 text-sm"
                >
                  Reset crop
                </button>
                <button
                  type="button"
                  onClick={handlePrepareImage}
                  disabled={
                    disabled || isPreparing || isRotating || !completedCrop
                  }
                  className="bg-brand px-4 py-2 text-sm text-white"
                >
                  {isRotating
                    ? "Rotating..."
                    : isPreparing
                      ? "Preparing..."
                      : "Prepare image"}
                </button>
              </div>
            </div>

            <div className="border border-border bg-surface p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                Output target
              </p>
              <div className="mt-4 space-y-2 text-sm text-foreground-muted">
                <p>Format: JPEG</p>
                <p>Max dimension: {MAX_OUTPUT_DIMENSION}px</p>
                <p>Compression quality: {OUTPUT_QUALITY}</p>
                <p>
                  Target size: under{" "}
                  {formatFileSize(MAX_OUTPUT_SIZE_MB * 1024 * 1024)} with enough
                  detail for label text.
                </p>
              </div>
            </div>

            {completedCrop && sourceDimensions ? (
              <div className="border border-border bg-surface p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                  Selected area
                </p>
                <div className="mt-4 space-y-2 text-sm text-foreground-muted">
                  <p>
                    Left:{" "}
                    {
                      toCropRect(
                        completedCrop,
                        sourceDimensions.width,
                        sourceDimensions.height,
                      ).left
                    }
                    %
                  </p>
                  <p>
                    Top:{" "}
                    {
                      toCropRect(
                        completedCrop,
                        sourceDimensions.width,
                        sourceDimensions.height,
                      ).top
                    }
                    %
                  </p>
                  <p>
                    Width:{" "}
                    {
                      toCropRect(
                        completedCrop,
                        sourceDimensions.width,
                        sourceDimensions.height,
                      ).width
                    }
                    %
                  </p>
                  <p>
                    Height:{" "}
                    {
                      toCropRect(
                        completedCrop,
                        sourceDimensions.width,
                        sourceDimensions.height,
                      ).height
                    }
                    %
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <p className="mt-6 text-sm leading-7 text-foreground-muted">
        Prepared files stay in the browser for now. The next phase will send the
        cropped result to an OpenAI Vision endpoint.
      </p>
    </section>
  );
}
