import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");
import {
  saveFileWithText,
  getFilesBySubject,
  deleteFile,
  UploadedFile,
} from "@/backend/lib/files";

// Pure-JS PDF text extraction. No native binaries — Vercel-compatible.
// Returns empty string if pdf-parse fails or returns trivially short text.
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfData = await pdf(pdfBuffer);
    if (pdfData.text && pdfData.text.trim().length > 100) {
      return pdfData.text;
    }
  } catch {
    // fall through to empty
  }
  return "";
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
      extractedText = `[Файл: ${file.name} - текст гаргаж авах боломжгүй файлын төрөл]`;
    }

    const fileMeta: UploadedFile = {
      id: fileId,
      subjectId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    };
    await saveFileWithText(fileMeta, extractedText);

    return NextResponse.json({
      success: true,
      file: fileMeta,
      textLength: extractedText.length,
      warning: extractedText.trim()
        ? undefined
        : "PDF-ээс текст гаргаж авч чадсангүй. Файлыг дахин байршуулна уу.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Файл байршуулахад алдаа гарлаа: " + (error as Error).message },
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

export async function DELETE(req: NextRequest) {
  try {
    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json(
        { error: "fileId шаардлагатай" },
        { status: 400 }
      );
    }
    await deleteFile(fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Файл устгахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
