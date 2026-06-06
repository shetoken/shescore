/* Methodology version types (shared with the scoring helper).
   shescore.org has no global version toggle: the site shows the official v2
   score, and the Methodology Lab shows v3 shadow scores separately. This file
   exists only to provide the shared type + labels the scoring helper imports. */

export type ApiVersion = "v2" | "v3";

export const API_VERSIONS: { value: ApiVersion; label: string; shadow: boolean }[] = [
  { value: "v2", label: "v2 — Official", shadow: false },
  { value: "v3", label: "v3 — Shadow (in validation)", shadow: true },
];
