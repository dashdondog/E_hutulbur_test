import { getDb } from "./mongodb";

export interface UploadedFile {
  id: string;
  subjectId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  hasText?: boolean;
  charCount?: number;
}

interface FileDoc extends UploadedFile {
  extractedText: string;
}

const COLLECTION = "subjectFiles";

function projectMeta(doc: FileDoc): UploadedFile {
  const { id, subjectId, fileName, fileSize, mimeType, uploadedAt, hasText, charCount } = doc;
  const chars = charCount ?? (doc.extractedText ? doc.extractedText.trim().length : 0);
  return {
    id,
    subjectId,
    fileName,
    fileSize,
    mimeType,
    uploadedAt,
    hasText: hasText ?? (chars > 20),
    charCount: chars,
  };
}

export async function getFilesBySubject(subjectId: string): Promise<UploadedFile[]> {
  const db = await getDb();
  const docs = await db
    .collection<FileDoc>(COLLECTION)
    .find({ subjectId })
    .sort({ uploadedAt: -1 })
    .toArray();
  return docs.map(projectMeta);
}

export async function saveFileWithText(
  meta: UploadedFile,
  extractedText: string
): Promise<void> {
  const db = await getDb();
  await db.collection<FileDoc>(COLLECTION).insertOne({ ...meta, extractedText });
}

export async function deleteFile(fileId: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ id: fileId });
}

export async function getCombinedText(subjectId: string): Promise<string> {
  const db = await getDb();
  const docs = await db
    .collection<FileDoc>(COLLECTION)
    .find({ subjectId })
    .project<{ fileName: string; extractedText: string }>({ fileName: 1, extractedText: 1 })
    .toArray();
  return docs
    .map((f) => `=== ${f.fileName} ===\n${f.extractedText}`)
    .join("\n\n");
}
