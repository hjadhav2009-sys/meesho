import { extractPdfPages } from "./extract-pages";

export async function extractPdfText(buffer: Buffer) {
  const pages = await extractPdfPages(buffer);
  return pages.map((page) => page.text).join("\n\n");
}
