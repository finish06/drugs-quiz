/** Pagination metadata returned by all list endpoints */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/** Drug name entry from GET /v1/drugs/names */
export interface DrugName {
  name: string;
  type: "generic" | "brand";
}

/** Drug class entry from GET /v1/drugs/classes */
export interface DrugClass {
  name: string;
  type: "epc" | "moa" | "pe" | "cs";
}

/** Drug class lookup result from GET /v1/drugs/class?name={name} */
export interface DrugClassLookup {
  query_name: string;
  generic_name: string;
  brand_names: string[];
  classes: DrugClassEntry[];
}

/** Individual class entry within a lookup result */
export interface DrugClassEntry {
  name: string;
  type: string;
}

/** Drug in a class from GET /v1/drugs/classes/drugs?class={name} */
export interface DrugInClass {
  generic_name: string;
  brand_name: string;
}

/** NDC lookup result from GET /v1/drugs/ndc/{ndc} */
export interface NdcLookup {
  ndc: string;
  name: string;
  generic_name: string;
  classes: string[];
}

/** API error response shape */
export interface ApiError {
  error: string;
  message: string;
}

/** Query params for GET /v1/drugs/names */
export interface DrugNamesParams {
  q?: string;
  type?: "generic" | "brand" | "all";
  page?: number;
  limit?: number;
}

/** Query params for GET /v1/drugs/classes */
export interface DrugClassesParams {
  type?: "epc" | "moa" | "pe" | "cs" | "all";
  page?: number;
  limit?: number;
}

/** Query params for GET /v1/drugs/classes/drugs */
export interface DrugsInClassParams {
  class: string;
  page?: number;
  limit?: number;
}
