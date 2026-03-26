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

/** API base path — same-origin proxy (BFF in prod, Vite proxy in dev) handles auth */
const API_BASE = "/api";

/** In-memory response cache with 5-minute TTL */
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  responseCache.set(key, { data, timestamp: Date.now() });
}

/** Clear all cached responses */
export function clearRequestCache(): void {
  responseCache.clear();
}

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
  const cached = getCached<T>(path);
  if (cached) return cached;

  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new DrugApiError(response.status, error);
  }

  const data = await response.json() as T;
  setCache(path, data);
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

export { DrugApiError };
