import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import {
  saveUploadedFile,
  saveFileMeta,
  saveExtractedText,
  getFilesBySubject,
  deleteFileMeta,
  deleteUploadedFile,
  removeExtractedText,
  UploadedFile,
} from "@/backend/lib/files";

// Extract text from PDF: try pdftotext first (better Cyrillic), then pdf-parse, then OCR
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  // Write buffer to temp file for CLI tools
  const tmpDir = os.tmpdir();
  const tmpPdf = path.join(tmpDir, `upload_${Date.now()}.pdf`);
  fs.writeFileSync(tmpPdf, pdfBuffer);

  try {
    // 1. Try pdftotext (poppler) - handles Mongolian Cyrillic encoding well
    try {
      const txtOut = path.join(tmpDir, `upload_${Date.now()}.txt`);
      execSync(`pdftotext -enc UTF-8 "${tmpPdf}" "${txtOut}"`, { timeout: 120000 });
      const text = fs.readFileSync(txtOut, "utf-8");
      fs.unlinkSync(txtOut);
      if (text.trim().length > 100) {
        return text;
      }
    } catch {
      // continue to pdf-parse
    }

    // 2. Try pdf-parse (fallback)
    try {
      const pdfData = await pdf(pdfBuffer);
      if (pdfData.text && pdfData.text.trim().length > 100) {
        return pdfData.text;
      }
    } catch {
      // continue to OCR
    }

    // 3. OCR via tesseract (for image/scanned PDFs)
    // Convert PDF pages to images using pdftoppm, then OCR each
    try {
      const ocrDir = path.join(tmpDir, `ocr_${Date.now()}`);
      fs.mkdirSync(ocrDir, { recursive: true });

      // Convert PDF to PPM images
      execSync(`pdftoppm -r 200 "${tmpPdf}" "${ocrDir}/page"`, { timeout: 300000 });

      const imageFiles = fs.readdirSync(ocrDir)
        .filter((f: string) => f.endsWith(".ppm"))
        .sort();

      let fullText = "";
      for (const img of imageFiles) {
        const imgPath = path.join(ocrDir, img);
        const baseName = imgPath.replace(/\.ppm$/, "");
        try {
          execSync(`tesseract "${imgPath}" "${baseName}" -l eng`, { timeout: 60000 });
          const pageText = fs.readFileSync(`${baseName}.txt`, "utf-8");
          fullText += pageText + "\n";
        } catch {
          // skip failed page
        }
      }

      // Cleanup OCR dir
      fs.rmSync(ocrDir, { recursive: true, force: true });

      if (fullText.trim().length > 0) {
        return fullText;
      }
    } catch {
      // OCR failed entirely
    }
  } finally {
    // Cleanup temp PDF
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
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
    const filePath = saveUploadedFile(subjectId, fileId, file.name, buffer);

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
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    };
    saveFileMeta(fileMeta);

    // Save extracted text
    if (extractedText.trim()) {
      saveExtractedText(subjectId, fileId, file.name, extractedText);
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
  const files = getFilesBySubject(subjectId);
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

    const files = getFilesBySubject(subjectId);
    const file = files.find((f) => f.id === fileId);
    if (!file) {
      return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 404 });
    }

    if (!fs.existsSync(file.filePath)) {
      return NextResponse.json({ error: "Файл дискэн дээр олдсонгүй" }, { status: 404 });
    }

    const buffer = fs.readFileSync(file.filePath);
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
    removeExtractedText(subjectId, fileId);
    saveExtractedText(subjectId, fileId, file.fileName, extractedText);

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

    const files = getFilesBySubject(subjectId);
    const file = files.find((f) => f.id === fileId);
    if (file) {
      deleteUploadedFile(file.filePath);
    }
    deleteFileMeta(fileId);
    removeExtractedText(subjectId, fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Файл устгахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
