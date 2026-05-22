import { NextRequest, NextResponse } from "next/server";
import {
  saveFileWithText,
  getFilesBySubject,
  deleteFile,
  UploadedFile,
} from "@/backend/lib/files";
import { getAuthUser } from "@/backend/lib/auth";

// Client extracts PDF text in the browser and posts JSON. Server only persists
// metadata + text — the binary never crosses the wire, side-stepping Vercel's
// 4.5MB body cap on textbook-sized PDFs.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, fileName, fileSize, mimeType, extractedText } = body as {
      subjectId?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      extractedText?: string;
    };

    if (!subjectId || !fileName) {
      return NextResponse.json(
        { error: "subjectId болон fileName шаардлагатай" },
        { status: 400 }
      );
    }

    const fileMeta: UploadedFile = {
      id: crypto.randomUUID(),
      subjectId,
      fileName,
      fileSize: fileSize ?? 0,
      mimeType: mimeType ?? "",
      uploadedAt: new Date().toISOString(),
    };
    const text = extractedText ?? "";
    await saveFileWithText(fileMeta, text);

    return NextResponse.json({
      success: true,
      file: fileMeta,
      textLength: text.length,
      warning: text.trim()
        ? undefined
        : "Файлаас текст гаргаж авч чадсангүй. Файлыг дахин байршуулна уу.",
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
