import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse");
import mammoth from "mammoth";
import {
  saveFileWithText,
  getFilesBySubject,
  deleteFile,
  UploadedFile,
} from "@/backend/lib/files";
import { getAuthUser } from "@/backend/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string | null;

    if (!subjectId || !file) {
      return NextResponse.json(
        { error: "subjectId болон файл шаардлагатай" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isDocx =
      name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isText = file.type === "text/plain" || /\.(txt|md)$/i.test(file.name);

    let text = "";
    if (isPdf) {
      try {
        const data = await pdfParse(buffer);
        text = data.text || "";
      } catch (pdfErr) {
        console.warn("pdfParse failed:", pdfErr);
        text = "";
      }
    } else if (isDocx) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || "";
      } catch (docxErr) {
        console.warn("mammoth failed:", docxErr);
        text = "";
      }
    } else if (isText) {
      text = buffer.toString("utf-8");
    } else {
      text = `[Файл: ${file.name}]`;
    }

    const cleanLen = text.trim().length;
    const hasText = cleanLen > 20;
    console.log(`[upload] ${file.name}: extracted ${text.length} chars (trimmed: ${cleanLen})`);

    const fileMeta: UploadedFile = {
      id: crypto.randomUUID(),
      subjectId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      hasText,
      charCount: cleanLen,
    };
    await saveFileWithText(fileMeta, text);

    const warning = hasText
      ? undefined
      : isPdf
      ? "Энэ PDF файл нь зурган (сканнердсан) хэлбэртэй тул бичвэр уншигдсангүй. Систем улсын стандартын дагуу сэдвүүдийг автоматаар гаргана (мөн та Word .docx эсвэл тексттэй PDF файл оруулж болно)."
      : "Файлаас бичвэр уншиж чадсангүй.";

    return NextResponse.json({
      success: true,
      file: fileMeta,
      textLength: cleanLen,
      hasText,
      warning,
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
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const user = await getAuthUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
