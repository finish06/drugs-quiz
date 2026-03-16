import type {
  PaginatedResponse,
  DrugName,
  DrugClass,
  DrugClassLookup,
  DrugInClass,
  NdcLookup,
  DrugNamesParams,
  DrugClassesParams,
  DrugsInClassParams,
  ApiError,
} from "@/types/api";

/** API base path — same-origin proxy handles auth and forwards to drug-gate */
const API_BASE = "/api";

/** In-memory request cache — avoids redundant network calls during quiz generation */
const requestCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class DrugApiError extends Error {
  constructor(
    public status: number,
    public apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = "DrugApiError";
  }
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] !== undefined,
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

async function request<T>(path: string): Promise<T> {
  const cached = requestCache.get(path);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new DrugApiError(response.status, error);
  }

  const data = await response.json() as T;
  requestCache.set(path, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

/** GET /v1/drugs/names — browse or search drug names */
export function getDrugNames(
  params: DrugNamesParams = {},
): Promise<PaginatedResponse<DrugName>> {
  const qs = buildQueryString({ ...params });
  return request(`/v1/drugs/names${qs}`);
}

/** GET /v1/drugs/classes — browse pharmacological classes */
export function getDrugClasses(
  params: DrugClassesParams = {},
): Promise<PaginatedResponse<DrugClass>> {
  const qs = buildQueryString({ ...params });
  return request(`/v1/drugs/classes${qs}`);
}

/** GET /v1/drugs/class?name={name} — look up drug's class */
export function getDrugClass(name: string): Promise<DrugClassLookup> {
  return request(`/v1/drugs/class?name=${encodeURIComponent(name)}`);
}

/** GET /v1/drugs/classes/drugs?class={name} — list drugs in a class */
export function getDrugsInClass(
  params: DrugsInClassParams,
): Promise<PaginatedResponse<DrugInClass>> {
  const qs = buildQueryString({
    class: params.class,
    page: params.page,
    limit: params.limit,
  });
  return request(`/v1/drugs/classes/drugs${qs}`);
}

/** GET /v1/drugs/ndc/{ndc} — look up drug by NDC */
export function getDrugByNdc(ndc: string): Promise<NdcLookup> {
  return request(`/v1/drugs/ndc/${encodeURIComponent(ndc)}`);
}

/** Clear the request cache (useful for tests) */
export function clearRequestCache(): void {
  requestCache.clear();
}

export { DrugApiError };
