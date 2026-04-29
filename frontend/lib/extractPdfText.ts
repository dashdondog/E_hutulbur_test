// Browser-side PDF text extraction. Runs in the browser so we never upload the
// full PDF binary to the server — bypasses Vercel's 4.5MB body limit and our
// own MongoDB document cap. Only the extracted text is sent up.

export async function extractPdfTextInBrowser(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker bundled as ESM module from unpkg, version-pinned to the installed
  // pdfjs-dist build. Avoids bundler-specific worker-import syntax.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }
  await doc.destroy();
  return pages.join("\n\n");
}
