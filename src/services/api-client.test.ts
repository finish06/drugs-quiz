import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDrugNames,
  getDrugClasses,
  getDrugClass,
  getDrugsInClass,
  getDrugByNdc,
  DrugApiError,
  clearRequestCache,
} from "./api-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  clearRequestCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getDrugNames", () => {
  it("fetches drug names with default params", async () => {
    const mockData = {
      data: [
        { name: "Simvastatin", type: "generic" },
        { name: "Zocor", type: "brand" },
      ],
      pagination: { page: 1, limit: 50, total: 2, total_pages: 1 },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

    const result = await getDrugNames();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain("/api/v1/drugs/names");
    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.name).toBe("Simvastatin");
  });

  it("passes query params correctly", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } }),
    );

    await getDrugNames({ q: "simva", type: "generic", page: 2, limit: 10 });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain("q=simva");
    expect(url).toContain("type=generic");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
  });

  it("omits undefined params from query string", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } }),
    );

    await getDrugNames({ type: "brand" });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).not.toContain("q=");
    expect(url).toContain("type=brand");
  });
});

describe("getDrugClasses", () => {
  it("fetches drug classes with type filter", async () => {
    const mockData = {
      data: [{ name: "HMG-CoA Reductase Inhibitor", type: "epc" }],
      pagination: { page: 1, limit: 50, total: 1, total_pages: 1 },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

    const result = await getDrugClasses({ type: "epc" });

    expect(result.data[0]!.name).toBe("HMG-CoA Reductase Inhibitor");
    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain("type=epc");
  });
});

describe("getDrugClass", () => {
  it("looks up drug class by name", async () => {
    const mockData = {
      query_name: "simvastatin",
      generic_name: "simvastatin",
      brand_names: ["Zocor"],
      classes: [{ name: "HMG-CoA Reductase Inhibitor", type: "EPC" }],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

    const result = await getDrugClass("simvastatin");

    expect(result.generic_name).toBe("simvastatin");
    expect(result.brand_names).toContain("Zocor");
    expect(result.classes[0]!.name).toBe("HMG-CoA Reductase Inhibitor");
    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain("/api/v1/drugs/class?name=simvastatin");
  });

  it("encodes special characters in drug name", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        query_name: "test drug",
        generic_name: "test drug",
        brand_names: [],
        classes: [],
      }),
    );

    await getDrugClass("test drug");

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain("name=test%20drug");
  });
});

describe("getDrugsInClass", () => {
  it("fetches drugs in a class", async () => {
    const mockData = {
      data: [
        { generic_name: "simvastatin", brand_name: "Zocor" },
        { generic_name: "atorvastatin calcium", brand_name: "Lipitor" },
      ],
      pagination: { page: 1, limit: 100, total: 2, total_pages: 1 },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

    const result = await getDrugsInClass({ class: "HMG-CoA Reductase Inhibitor" });

    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.generic_name).toBe("simvastatin");
  });
});

describe("getDrugByNdc", () => {
  it("looks up drug by NDC", async () => {
    const mockData = {
      ndc: "00069-3150",
      name: "Lipitor",
      generic_name: "atorvastatin calcium",
      classes: ["HMG-CoA Reductase Inhibitor [EPC]"],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

    const result = await getDrugByNdc("00069-3150");

    expect(result.name).toBe("Lipitor");
    expect(result.generic_name).toBe("atorvastatin calcium");
  });
});

describe("error handling", () => {
  it("throws DrugApiError on 401", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "unauthorized", message: "Missing API key" }, 401),
    );

    try {
      await getDrugNames();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(DrugApiError);
      expect((e as DrugApiError).status).toBe(401);
      expect((e as DrugApiError).apiError.error).toBe("unauthorized");
    }
  });

  it("throws DrugApiError on 404", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "not_found", message: "Drug not found" }, 404),
    );

    await expect(getDrugClass("nonexistent")).rejects.toThrow(DrugApiError);
  });

  it("throws DrugApiError on 429 rate limit", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "rate_limited", message: "Too many requests" }, 429),
    );

    await expect(getDrugNames()).rejects.toThrow(DrugApiError);
  });

  it("throws DrugApiError on 502 upstream error", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "upstream_error", message: "Backend unavailable" }, 502),
    );

    await expect(getDrugClass("simvastatin")).rejects.toThrow(DrugApiError);
  });

  it("DrugApiError has correct message", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "not_found", message: "Drug not found" }, 404),
    );

    try {
      await getDrugClass("nonexistent");
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(DrugApiError);
      expect((e as DrugApiError).message).toBe("Drug not found");
      expect((e as DrugApiError).status).toBe(404);
    }
  });
});
