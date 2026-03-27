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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subjectId", subjectId);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Файл байршуулахад алдаа гарлаа");
          return;
        }

        onFilesChange();
      } catch {
        alert("Файл байршуулахад алдаа гарлаа");
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
      return <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><FileText size={18} className="text-red-500" /></div>;
    if (mimeType.startsWith("text/") || fileName.endsWith(".txt") || fileName.endsWith(".md"))
      return <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center"><File size={18} className="text-[var(--color-primary)]" /></div>;
    if (mimeType.startsWith("image/"))
      return <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center"><FileImage size={18} className="text-[var(--color-primary)]" /></div>;
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
      return <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center"><FileText size={18} className="text-[var(--color-primary)]" /></div>;
    return <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center"><Paperclip size={18} className="text-[var(--color-text-muted)]" /></div>;
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
            : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
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
        {uploading ? (
          <div>
            <div className="animate-spin w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-[var(--color-primary)] font-medium">
              Файл байршуулж байна...
            </p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-3">
              <Upload size={28} className="text-[var(--color-primary)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              PDF, TXT файлаа энд чирж оруулна уу
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              эсвэл энд дарж файл сонгоно уу
            </p>
          </>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(f.mimeType, f.fileName)}
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {f.fileName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatSize(f.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                className="text-[var(--color-text-muted)] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Устгах"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
