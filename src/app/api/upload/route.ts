import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");
import {
  saveUploadedFile,
  saveFileMeta,
  saveExtractedText,
  getFilesBySubject,
  deleteFileMeta,
  deleteUploadedFile,
  removeExtractedText,
  getFileBuffer,
  UploadedFile,
} from "@/backend/lib/files";

// Extract text from PDF using pdf-parse only (serverless-compatible)
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfData = await pdf(pdfBuffer);
    return pdfData.text || "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string;

    if (!file || !subjectId) {
      return NextResponse.json(
        { error: "file болон subjectId шаардлагатай" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = crypto.randomUUID();
    await saveUploadedFile(subjectId, fileId, file.name, buffer);

    // Extract text based on file type
    let extractedText = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      extractedText = await extractPdfText(buffer);
    } else if (
      file.type === "text/plain" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md")
    ) {
      extractedText = buffer.toString("utf-8");
    } else {
      // For other file types, store as-is (images, docs etc)
      extractedText = `[Файл: ${file.name} - текст гаргаж авах боломжгүй файлын төрөл]`;
    }

    // Save file metadata
    const fileMeta: UploadedFile = {
      id: fileId,
      subjectId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    };
    await saveFileMeta(fileMeta);

    // Save extracted text
    if (extractedText.trim()) {
      await saveExtractedText(subjectId, fileId, file.name, extractedText);
    }

    return NextResponse.json({
      success: true,
      file: fileMeta,
      textLength: extractedText.length,
      warning: extractedText.trim() ? undefined : "PDF-ээс текст гаргаж авч чадсангүй. Файлыг дахин байршуулна уу.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Файл байршуулахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) {
    return NextResponse.json(
      { error: "subjectId шаардлагатай" },
      { status: 400 }
    );
  }
  const files = await getFilesBySubject(subjectId);
  return NextResponse.json({ files });
}

// Re-extract text from existing uploaded file
export async function PATCH(req: NextRequest) {
  try {
    const { fileId, subjectId } = await req.json();
    if (!fileId || !subjectId) {
      return NextResponse.json(
        { error: "fileId болон subjectId шаардлагатай" },
        { status: 400 }
      );
    }

    const files = await getFilesBySubject(subjectId);
    const file = files.find((f) => f.id === fileId);
    if (!file) {
      return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 404 });
    }

    const buffer = await getFileBuffer(fileId);
    if (!buffer) {
      return NextResponse.json({ error: "Файлын өгөгдөл олдсонгүй" }, { status: 404 });
    }

    let extractedText = "";

    if (file.fileName.endsWith(".pdf")) {
      extractedText = await extractPdfText(buffer as Buffer);
    } else if (file.fileName.endsWith(".txt") || file.fileName.endsWith(".md")) {
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "PDF-ээс текст гаргаж авч чадсангүй" },
        { status: 400 }
      );
    }

    // Remove old text and save new
    await removeExtractedText(subjectId, fileId);
    await saveExtractedText(subjectId, fileId, file.fileName, extractedText);

    return NextResponse.json({ success: true, textLength: extractedText.length });
  } catch (error) {
    console.error("Re-extract error:", error);
    return NextResponse.json(
      { error: "Текст дахин гаргахад алдаа гарлаа: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { fileId, subjectId } = await req.json();
    if (!fileId || !subjectId) {
      return NextResponse.json(
        { error: "fileId болон subjectId шаардлагатай" },
        { status: 400 }
      );
    }

    await deleteUploadedFile(fileId);
    await deleteFileMeta(fileId);
    await removeExtractedText(subjectId, fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Файл устгахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
