import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse");
import mammoth from "mammoth";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

async function extractPdf(buffer: Buffer): Promise<string> {
  const tmpDir = os.tmpdir();
  const tmpPdf = path.join(tmpDir, `tpl_${Date.now()}.pdf`);
  fs.writeFileSync(tmpPdf, buffer);

  try {
    try {
      const txtOut = path.join(tmpDir, `tpl_${Date.now()}.txt`);
      execSync(`pdftotext -enc UTF-8 "${tmpPdf}" "${txtOut}"`, { timeout: 60000 });
      const text = fs.readFileSync(txtOut, "utf-8");
      fs.unlinkSync(txtOut);
      if (text.trim().length > 50) return text;
    } catch {
      // fall through
    }

    const data = await pdfParse(buffer);
    return data.text || "";
  } finally {
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Файл шаардлагатай" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = "";

    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
      text = await extractPdf(buffer);
    } else if (
      name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".doc") || file.type === "application/msword") {
      return NextResponse.json(
        { error: "Хуучин .doc форматыг дэмжихгүй. .docx болгон хадгалаад дахин оруулна уу." },
        { status: 400 }
      );
    } else if (
      file.type === "text/plain" ||
      name.endsWith(".txt") ||
      name.endsWith(".md")
    ) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".html") || name.endsWith(".htm") || file.type === "text/html") {
      text = stripHtml(buffer.toString("utf-8"));
    } else {
      return NextResponse.json(
        { error: "Дэмжигдэхгүй файлын төрөл (зөвхөн PDF, DOCX, TXT, MD, HTML)" },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Файлаас текст гаргаж чадсангүй" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, text, fileName: file.name });
  } catch (error) {
    console.error("Template extract error:", error);
    return NextResponse.json(
      { error: "Файлаас текст гаргахад алдаа: " + (error as Error).message },
      { status: 500 }
    );
  }
}
