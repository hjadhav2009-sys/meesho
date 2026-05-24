import { compactWhitespace } from "./normalize";
import type { MeeshoDetectedType, MeeshoTextPage } from "./types";

export function classifyMeeshoPdf(pages: MeeshoTextPage[]): MeeshoDetectedType {
  const text = compactWhitespace(pages.map((page) => page.text).join(" ")).toLowerCase();
  const hasLabelSignals =
    text.includes("customer address") || text.includes("product details") || text.includes("tax invoice");
  const hasCourierWiseTable =
    (text.includes("courier :") || text.includes("courier:")) &&
    (text.includes("sub order no") || text.includes("s. no.") || text.includes("awb sku"));
  const hasManifestSignals = text.includes("picklist") || text.includes("s. no. sub order no. awb sku") || hasCourierWiseTable;

  if (hasManifestSignals) {
    return "MANIFEST_PDF";
  }

  if (hasLabelSignals) {
    return "LABEL_PDF";
  }

  return "UNKNOWN";
}
