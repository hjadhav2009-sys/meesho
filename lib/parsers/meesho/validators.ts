import type { ParseIssue } from "./types";

export function countIssuesByType(issues: ParseIssue[], issueType: string) {
  return issues.filter((issue) => issue.issueType === issueType).length;
}

export function hasBlockingIssues(issues: ParseIssue[]) {
  return issues.some((issue) => issue.issueType === "MISSING_AWB" || issue.issueType === "MISSING_SKU");
}
