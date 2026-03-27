import { Binary } from "mongodb";
import { getDb } from "./mongodb";

export interface UploadedFile {
  id: string;
  subjectId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface SubjectTexts {
  subjectId: string;
  files: { fileId: string; fileName: string; text: string }[];
  updatedAt: string;
}

// Save uploaded file buffer as Binary to MongoDB `files` collection
export async function saveUploadedFile(
  subjectId: string,
  fileId: string,
  fileName: string,
  buffer: Buffer
): Promise<void> {
  const db = await getDb();
  await db.collection("files").insertOne({
    id: fileId,
    subjectId,
    fileName,
    fileData: new Binary(buffer),
    fileSize: buffer.length,
    uploadedAt: new Date().toISOString(),
  });
}

// Save file metadata to MongoDB `files` collection (updates existing doc)
export async function saveFileMeta(file: UploadedFile): Promise<void> {
  const db = await getDb();
  await db.collection("files").updateOne(
    { id: file.id },
    {
      $set: {
        subjectId: file.subjectId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
      },
    },
    { upsert: true }
  );
}

// Get all files for a subject
export async function getFilesBySubject(subjectId: string): Promise<UploadedFile[]> {
  const db = await getDb();
  const docs = await db
    .collection("files")
    .find({ subjectId }, { projection: { fileData: 0, _id: 0 } })
    .toArray();
  return docs.map((d) => ({
    id: d.id,
    subjectId: d.subjectId,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    uploadedAt: d.uploadedAt,
  }));
}

// Delete file metadata from MongoDB
export async function deleteFileMeta(fileId: string): Promise<void> {
  const db = await getDb();
  await db.collection("files").deleteOne({ id: fileId });
}

// Delete uploaded file data from MongoDB by fileId
export async function deleteUploadedFile(fileId: string): Promise<void> {
  const db = await getDb();
  await db.collection("files").deleteOne({ id: fileId });
}

// Get file buffer from MongoDB
export async function getFileBuffer(fileId: string): Promise<Buffer | null> {
  const db = await getDb();
  const doc = await db.collection("files").findOne({ id: fileId });
  if (!doc || !doc.fileData) return null;
  return doc.fileData.buffer as Buffer;
}

// Save extracted text to MongoDB `extractedTexts` collection
export async function saveExtractedText(
  subjectId: string,
  fileId: string,
  fileName: string,
  text: string
): Promise<void> {
  const db = await getDb();
  await db.collection("extractedTexts").insertOne({
    subjectId,
    fileId,
    fileName,
    text,
    updatedAt: new Date().toISOString(),
  });
}

// Get all extracted texts for a subject
export async function getSubjectTexts(subjectId: string): Promise<SubjectTexts> {
  const db = await getDb();
  const docs = await db
    .collection("extractedTexts")
    .find({ subjectId })
    .toArray();
  const files = docs.map((d) => ({
    fileId: d.fileId,
    fileName: d.fileName,
    text: d.text,
  }));
  const latestUpdate = docs.length > 0
    ? docs.reduce((latest, d) => (d.updatedAt > latest ? d.updatedAt : latest), "")
    : "";
  return { subjectId, files, updatedAt: latestUpdate };
}

// Remove extracted text for a specific file
export async function removeExtractedText(subjectId: string, fileId: string): Promise<void> {
  const db = await getDb();
  await db.collection("extractedTexts").deleteMany({ subjectId, fileId });
}

// Get combined text for AI consumption
export async function getCombinedText(subjectId: string): Promise<string> {
  const data = await getSubjectTexts(subjectId);
  return data.files
    .map((f) => `=== ${f.fileName} ===\n${f.text}`)
    .join("\n\n");
}

// Get all files across all subjects
export async function getAllFiles(): Promise<UploadedFile[]> {
  const db = await getDb();
  const docs = await db
    .collection("files")
    .find({}, { projection: { fileData: 0, _id: 0 } })
    .toArray();
  return docs.map((d) => ({
    id: d.id,
    subjectId: d.subjectId,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    uploadedAt: d.uploadedAt,
  }));
}
