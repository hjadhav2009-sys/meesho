import {
  compactWhitespace,
  isValidAwb,
  normalizeAwb,
  normalizeCourier,
  normalizeOrderNo,
  normalizeQty,
  normalizeSku,
  normalizeWhitespace,
  scoreAndIssues
} from "./normalize";
import type { MeeshoTextPage, ParsedMeeshoManifestOrder, ParsedMeeshoPicklistSummaryRow, ParseIssue } from "./types";

const sizePattern = "(?:Free\\s+Size|XS|S|M|L|XL|XXL|XXXL|\\d+[A-Za-z]*)";

function cleanLines(text: string) {
  return normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\(\d+\)$/.test(line))
    .filter((line) => !/^S\.?\s*No\.?/i.test(line))
    .filter((line) => !/^Supplier\s+Name\s*:/i.test(line))
    .filter((line) => !/^Date\s*:/i.test(line));
}

function findCourier(text: string) {
  const match = text.match(/Courier\s*:?\s*(Delhivery|Shadowfax|Xpress\s*Bees|XpressBees)/i);
  return normalizeCourier(match?.[1] ?? text);
}

function findSupplier(text: string) {
  return text.match(/Supplier\s+Name\s*:?\s*([^\n]+)/i)?.[1]?.trim();
}

function parseSummaryRow(pageNumber: number, rawRowText: string, supplierName?: string): ParsedMeeshoPicklistSummaryRow | null {
  const row = compactWhitespace(rawRowText);
  const match = row.match(new RegExp(`^(.+?)\\s+([A-Za-z]+)\\s+(${sizePattern})\\s+(\\d+)\\s*$`, "i"));

  if (!match) {
    return null;
  }

  const sku = normalizeSku(match[1]);
  const color = match[2];
  const size = compactWhitespace(match[3]);
  const totalQuantity = normalizeQty(match[4]);
  const issues: ParseIssue[] = [];
  let confidence = 0;

  if (sku) {
    confidence += 35;
  } else {
    issues.push({ issueType: "MISSING_SKU", message: "Summary SKU was not found.", severity: "ERROR", pageNumber });
  }

  if (color) {
    confidence += 15;
  }

  if (size) {
    confidence += 20;
  }

  if (totalQuantity) {
    confidence += 30;
  } else {
    issues.push({ issueType: "MISSING_QTY", message: "Summary total quantity was not found.", severity: "ERROR", pageNumber });
  }

  if (confidence < 70) {
    issues.push({ issueType: "LOW_CONFIDENCE", message: `Parser confidence is ${confidence}.`, severity: "WARNING", pageNumber });
  }

  return {
    pageNumber,
    sourceType: "PICKLIST_SUMMARY",
    supplierName,
    sku,
    color,
    size,
    totalQuantity,
    rawRowText: row,
    confidence,
    issues
  };
}

export function parsePicklistSummaryPages(pages: MeeshoTextPage[]) {
  const rows: ParsedMeeshoPicklistSummaryRow[] = [];

  for (const page of pages) {
    if (!/Picklist/i.test(page.text) || !/Total\s+Quantity/i.test(page.text)) {
      continue;
    }

    const supplierName = findSupplier(page.text);
    const lines = cleanLines(page.text).filter((line) => !/Picklist|SKU\s+Color\s+Size\s+Total/i.test(line));

    for (const line of lines) {
      const parsed = parseSummaryRow(page.pageNumber, line, supplierName);

      if (parsed) {
        rows.push(parsed);
      }
    }
  }

  return rows;
}

function rowBlocksFromPage(page: MeeshoTextPage) {
  const lines = cleanLines(page.text);
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^Courier\s*:/i.test(line) || /^Packed$/i.test(line) || /^Picklist$/i.test(line)) {
      continue;
    }

    const serialStart = /^\d{1,4}(?:\s+\S|$)/.test(line) && (!/^\d+$/.test(line) || current.length === 0);

    if (serialStart) {
      if (current.length > 0) {
        blocks.push(current.join(" "));
      }
      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join(" "));
  }

  return blocks;
}

function parseOrderBlock(pageNumber: number, rawRowText: string, courier?: string, supplierName?: string): ParsedMeeshoManifestOrder {
  const raw = compactWhitespace(rawRowText);
  const withoutSerial = raw.replace(/^\d+\s+/, "");
  const candidatePattern = /\b(?:\d{10,20}|SF[A-Z0-9]{8,}|[A-Z]{2,}[A-Z0-9]{8,})\b/g;
  const issues: ParseIssue[] = [];
  let awb: string | undefined;
  let orderNo = "";
  let sku = "";
  let qty: number | undefined;
  let size: string | undefined;
  let fallback:
    | {
        awb: string;
        orderNo: string;
        sku: string;
        qty?: number;
        size?: string;
      }
    | undefined;

  for (const match of withoutSerial.matchAll(candidatePattern)) {
    const candidateAwb = normalizeAwb(match[0]);

    if (!isValidAwb(candidateAwb) || match.index === undefined) {
      continue;
    }

    const beforeAwb = withoutSerial.slice(0, match.index);
    const afterAwb = withoutSerial.slice(match.index + match[0].length);
    const candidateOrderNo = normalizeOrderNo(beforeAwb);
    const detailMatch = compactWhitespace(afterAwb).match(new RegExp(`^(.+?)\\s+(\\d+)\\s+(${sizePattern})(?:\\s+(?:Yes|No|Y|N|Packed))?$`, "i"));

    if (detailMatch) {
      const candidate = {
        awb: candidateAwb,
        orderNo: candidateOrderNo,
        sku: normalizeSku(detailMatch[1]),
        qty: normalizeQty(detailMatch[2]),
        size: compactWhitespace(detailMatch[3])
      };

      if (candidateOrderNo) {
        fallback = candidate;
        break;
      }

      fallback ??= candidate;
    }
  }

  if (fallback) {
    awb = fallback.awb;
    orderNo = fallback.orderNo;
    sku = fallback.sku;
    qty = fallback.qty;
    size = fallback.size;
  } else {
    issues.push({ issueType: "UNPARSED_ROW_DETAIL", message: "Could not confidently split AWB, SKU, quantity, and size.", severity: "WARNING", pageNumber });
  }

  const scored = scoreAndIssues({
    awb,
    sku,
    orderNo,
    qty,
    courier,
    size,
    pageNumber,
    manifest: true
  });

  return {
    pageNumber,
    sourceType: "MANIFEST_ORDER",
    supplierName,
    courier,
    awb,
    sku,
    qty,
    size,
    orderNo,
    rawRowText: raw,
    confidence: scored.confidence,
    issues: [...issues, ...scored.issues]
  };
}

export function parseCourierOrderPages(pages: MeeshoTextPage[]) {
  const orders: ParsedMeeshoManifestOrder[] = [];
  let currentCourier: string | undefined;
  let currentSupplier: string | undefined;

  for (const page of pages) {
    if (/Courier\s*:/i.test(page.text)) {
      currentCourier = findCourier(page.text);
      currentSupplier = findSupplier(page.text) ?? currentSupplier;
    }

    if (!currentCourier || !/AWB|Sub\s+Order\s+No/i.test(page.text)) {
      continue;
    }

    for (const block of rowBlocksFromPage(page)) {
      orders.push(parseOrderBlock(page.pageNumber, block, currentCourier, currentSupplier));
    }
  }

  return orders;
}

export function parseMeeshoManifestPages(pages: MeeshoTextPage[]) {
  return {
    manifestOrders: parseCourierOrderPages(pages),
    picklistSummaryRows: parsePicklistSummaryPages(pages)
  };
}
