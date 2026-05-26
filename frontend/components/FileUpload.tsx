"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, FileImage, File, Paperclip, Trash2 } from "lucide-react";

interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface Props {
  subjectId: string;
  files: UploadedFile[];
  onFilesChange: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FileUpload({ subjectId, files, onFilesChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("subjectId", subjectId);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Файл байршуулахад алдаа гарлаа");
          return;
        }

        onFilesChange();
      } catch (e) {
        alert("Файл байршуулахад алдаа гарлаа: " + (e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [subjectId, onFilesChange]
  );

  async function handleFiles(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      await uploadFile(fileList[i]);
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm("Файл устгах уу?")) return;
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, subjectId }),
    });
    onFilesChange();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function getFileIcon(mimeType: string, fileName: string) {
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf"))
      return <FileText size={16} className="text-red-500 shrink-0" />;
    if (mimeType.startsWith("text/") || fileName.endsWith(".txt") || fileName.endsWith(".md"))
      return <File size={16} className="text-[var(--color-primary)] shrink-0" />;
    if (mimeType.startsWith("image/"))
      return <FileImage size={16} className="text-[var(--color-primary)] shrink-0" />;
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
      return <FileText size={16} className="text-[var(--color-primary)] shrink-0" />;
    return <Paperclip size={16} className="text-[var(--color-text-muted)] shrink-0" />;
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-3">
      <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">
         Сурах бичиг болон нэмэлт материалаа байршуулна уу (PDF, TXT, MD, DOC).
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
        Сурах бичиг татах бол{" "}
        <a
          href="https://medle.mn/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-primary)] hover:underline font-medium"
        >
          medle.mn
        </a>
        {" "}дээр дарна уу.
      </p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.txt,.md,.doc,.docx"
        multiple
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drop zone / file picker */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-md px-3 py-3 text-sm cursor-pointer transition-colors ${
          dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
            : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
        } ${uploading ? "opacity-50 pointer-events-none" : ""} text-[var(--color-text-secondary)]`}
      >
        {uploading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
            <span>Файл байршуулж байна...</span>
          </>
        ) : (
          <>
            
            <span>📤 Файл сонгох эсвэл чирж оруулах</span>
          </>
        )}
      </div>

      {/* File list as chips */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-md px-3 py-2"
            >
              {getFileIcon(f.mimeType, f.fileName)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text)] truncate">{f.fileName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{formatSize(f.fileSize)}</p>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                title="Устгах"
              >
                <Trash2 size={14} /> Хасах
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
