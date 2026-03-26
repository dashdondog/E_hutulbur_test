"use client";

import { useState, useRef, useCallback } from "react";

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
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) return "📕";
    if (mimeType.startsWith("text/") || fileName.endsWith(".txt") || fileName.endsWith(".md")) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return "📘";
    return "📎";
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
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
            <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-blue-600 font-medium">
              Файл байршуулж байна...
            </p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">📂</div>
            <p className="text-sm font-medium text-slate-700">
              PDF, TXT файлаа энд чирж оруулна уу
            </p>
            <p className="text-xs text-slate-400 mt-1">
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
              className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {getFileIcon(f.mimeType, f.fileName)}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {f.fileName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatSize(f.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                className="text-slate-400 hover:text-red-500 text-sm"
              >
                Устгах
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
