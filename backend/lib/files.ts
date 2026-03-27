import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "backend", "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const TEXTS_DIR = path.join(DATA_DIR, "texts");

export interface UploadedFile {
  id: string;
  subjectId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface SubjectTexts {
  subjectId: string;
  files: { fileId: string; fileName: string; text: string }[];
  updatedAt: string;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// File metadata
function getMetaPath() {
  return path.join(DATA_DIR, "files-meta.json");
}

export function getAllFiles(): UploadedFile[] {
  const metaPath = getMetaPath();
  if (!fs.existsSync(metaPath)) return [];
  return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
}

export function getFilesBySubject(subjectId: string): UploadedFile[] {
  return getAllFiles().filter((f) => f.subjectId === subjectId);
}

export function saveFileMeta(file: UploadedFile) {
  const all = getAllFiles();
  all.push(file);
  fs.writeFileSync(getMetaPath(), JSON.stringify(all, null, 2));
}

export function deleteFileMeta(fileId: string) {
  const all = getAllFiles().filter((f) => f.id !== fileId);
  fs.writeFileSync(getMetaPath(), JSON.stringify(all, null, 2));
}

// Upload file to disk
export function saveUploadedFile(
  subjectId: string,
  fileId: string,
  fileName: string,
  buffer: Buffer
): string {
  const subjectDir = path.join(UPLOADS_DIR, subjectId);
  ensureDir(subjectDir);
  const ext = path.extname(fileName);
  const filePath = path.join(subjectDir, `${fileId}${ext}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function deleteUploadedFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Extracted texts per subject
function getTextsPath(subjectId: string) {
  ensureDir(TEXTS_DIR);
  return path.join(TEXTS_DIR, `${subjectId}.json`);
}

export function getSubjectTexts(subjectId: string): SubjectTexts {
  const p = getTextsPath(subjectId);
  if (!fs.existsSync(p)) {
    return { subjectId, files: [], updatedAt: "" };
  }
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveExtractedText(
  subjectId: string,
  fileId: string,
  fileName: string,
  text: string
) {
  const data = getSubjectTexts(subjectId);
  data.files.push({ fileId, fileName, text });
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(getTextsPath(subjectId), JSON.stringify(data, null, 2));
}

export function removeExtractedText(subjectId: string, fileId: string) {
  const data = getSubjectTexts(subjectId);
  data.files = data.files.filter((f) => f.fileId !== fileId);
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(getTextsPath(subjectId), JSON.stringify(data, null, 2));
}

// Get combined text for AI
export function getCombinedText(subjectId: string): string {
  const data = getSubjectTexts(subjectId);
  return data.files
    .map((f) => `=== ${f.fileName} ===\n${f.text}`)
    .join("\n\n");
}
