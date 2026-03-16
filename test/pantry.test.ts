import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoist mocks BEFORE imports ───────────────────────────────────────────────
const { mockDb, mockGetServerSession } = vi.hoisted(() => {
  const mockDb = {
    pantryItem: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  };
  const mockGetServerSession = vi.fn();
  return { mockDb, mockGetServerSession };
});

// ─── Mock next/cache ──────────────────────────────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// ─── Mock next-auth ───────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({ getServerSession: () => mockGetServerSession() }));

// ─── Mock auth options ────────────────────────────────────────────────────────
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

// ─── Mock Prisma db ───────────────────────────────────────────────────────────
vi.mock("@/lib/db", () => ({ db: mockDb }));

// ─── Import SUT after mocks ───────────────────────────────────────────────────
import {
  createPantryItem,
  processScannedBarcode,
  deletePantryItem,
  adjustQuantity,
} from "../src/app/actions/pantry"; // adjust path if needed

// ─── Helpers ─────────────────────────────────────────────────────────────────
const VALID_SESSION = { user: { id: "user-123", email: "test@example.com" } };

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const BASE_ITEM = {
  id: "item-1",
  itemName: "Milk",
  quantity: 2,
  unitLabel: "pcs",
  lowThreshold: 0,
  expirationDate: new Date("2026-03-22"),
  updatedAt: new Date("2026-03-15"),
  userId: "user-123",
  categoryId: null,
  spoonacularId: null,
};

// ─────────────────────────────────────────────────────────────────────────────
describe("createPantryItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns Unauthorized when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createPantryItem({}, makeFormData({ itemName: "Milk", quantity: "1" }));
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDb.pantryItem.create).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when session has no user id", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "x@x.com" } });
    const result = await createPantryItem({}, makeFormData({ itemName: "Milk" }));
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("creates a new item with no existing siblings", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.findMany.mockResolvedValue([]);
    mockDb.pantryItem.create.mockResolvedValue(BASE_ITEM);

    const fd = makeFormData({
      itemName: "Milk",
      quantity: "2",
      unitLabel: "pcs",
      categoryId: "cat-1",
      expirationDate: "2026-03-22",
    });

    const result = await createPantryItem({}, fd);

    expect(result.success).toBe(true);
    expect(result.item?.itemName).toBe("Milk");
    expect(result.item?.quantity).toBe(2);
    expect(mockDb.pantryItem.create).toHaveBeenCalledOnce();
    // No threshold migration when no siblings
    expect(mockDb.pantryItem.update).not.toHaveBeenCalled();
  });

  it("inherits and zeros out singleton sibling threshold (1 → 2 migration)", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    const singleton = { ...BASE_ITEM, id: "item-existing", lowThreshold: 3 };
    mockDb.pantryItem.findMany.mockResolvedValue([singleton]);
    mockDb.pantryItem.create.mockResolvedValue({ ...BASE_ITEM, lowThreshold: 3 });

    const result = await createPantryItem(
      {},
      makeFormData({ itemName: "Milk", quantity: "1" })
    );

    expect(result.success).toBe(true);
    // Singleton's threshold should be zeroed out
    expect(mockDb.pantryItem.update).toHaveBeenCalledWith({
      where: { id: "item-existing" },
      data: { lowThreshold: 0 },
    });
    // New item should carry the inherited threshold
    expect(mockDb.pantryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lowThreshold: 3 }) })
    );
  });

  it("does NOT migrate threshold when singleton has lowThreshold = 0", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.findMany.mockResolvedValue([{ ...BASE_ITEM, lowThreshold: 0 }]);
    mockDb.pantryItem.create.mockResolvedValue(BASE_ITEM);

    await createPantryItem({}, makeFormData({ itemName: "Milk", quantity: "1" }));

    expect(mockDb.pantryItem.update).not.toHaveBeenCalled();
    expect(mockDb.pantryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lowThreshold: 0 }) })
    );
  });

  it("inherits group threshold when 2+ siblings already exist", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.findMany.mockResolvedValue([
      { ...BASE_ITEM, id: "s1", lowThreshold: 5 },
      { ...BASE_ITEM, id: "s2", lowThreshold: 5 },
    ]);
    mockDb.pantryItem.create.mockResolvedValue({ ...BASE_ITEM, lowThreshold: 5 });

    await createPantryItem({}, makeFormData({ itemName: "Milk", quantity: "1" }));

    expect(mockDb.pantryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lowThreshold: 5 }) })
    );
    // No sibling updates needed in the group case
    expect(mockDb.pantryItem.update).not.toHaveBeenCalled();
  });

  it("defaults quantity to 1 when not provided", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.findMany.mockResolvedValue([]);
    mockDb.pantryItem.create.mockResolvedValue({ ...BASE_ITEM, quantity: 1 });

    await createPantryItem({}, makeFormData({ itemName: "Eggs" }));

    expect(mockDb.pantryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ quantity: 1 }) })
    );
  });

  it("uses a 7-day default expiration when none is provided", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.findMany.mockResolvedValue([]);
    mockDb.pantryItem.create.mockResolvedValue(BASE_ITEM);

    const before = Date.now();
    await createPantryItem({}, makeFormData({ itemName: "Eggs" }));
    const after = Date.now();

    const passedDate: Date =
      mockDb.pantryItem.create.mock.calls[0][0].data.expirationDate;
    const diffDays = (passedDate.getTime() - before) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(6.99);
    expect(diffDays).toBeLessThanOrEqual(7.01);
  });

  it("returns database error when create throws", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.findMany.mockResolvedValue([]);
    mockDb.pantryItem.create.mockRejectedValue(new Error("DB down"));

    const result = await createPantryItem({}, makeFormData({ itemName: "Milk" }));
    expect(result).toEqual({ success: false, error: "Database save failed." });
  });

  it("serialises Decimal fields to plain numbers in the response", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.findMany.mockResolvedValue([]);
    // Simulate Prisma Decimal objects
    mockDb.pantryItem.create.mockResolvedValue({
      ...BASE_ITEM,
      quantity: { toNumber: () => 3 } as any,
      lowThreshold: { toNumber: () => 0 } as any,
    });

    const result = await createPantryItem({}, makeFormData({ itemName: "Milk" }));
    expect(typeof result.item?.quantity).toBe("number");
    expect(typeof result.item?.lowThreshold).toBe("number");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("processScannedBarcode", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it("returns auth error when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await processScannedBarcode("012345678901");
    expect(result).toEqual({ success: false, error: "You must be logged in to add items." });
  });

  it("returns item preview (no DB save) when no categoryId given", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ title: "Organic Milk", ingredientId: 42 }),
    });

    const result = await processScannedBarcode("012345678901");

    expect(result).toEqual({
      success: true,
      item: { itemName: "Organic Milk", spoonacularId: 42 },
    });
    expect(mockDb.pantryItem.create).not.toHaveBeenCalled();
  });

  it("saves item to DB when categoryId is provided", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ title: "Organic Milk", ingredientId: 42 }),
    });
    const dbItem = { ...BASE_ITEM, itemName: "Organic Milk", spoonacularId: 42 };
    mockDb.pantryItem.create.mockResolvedValue(dbItem);

    const result = await processScannedBarcode("012345678901", "cat-1");

    expect(result.success).toBe(true);
    expect(mockDb.pantryItem.create).toHaveBeenCalledOnce();
    expect(mockDb.pantryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ itemName: "Organic Milk", spoonacularId: 42 }),
      })
    );
  });

  it("returns error when Spoonacular responds with non-OK status", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockFetch.mockResolvedValue({ ok: false });

    const result = await processScannedBarcode("000000000000");
    expect(result).toEqual({ success: false, error: "Could not find or save item." });
  });

  it("returns error when fetch itself throws", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await processScannedBarcode("000000000000");
    expect(result).toEqual({ success: false, error: "Could not find or save item." });
  });

  it("calls the Spoonacular endpoint with the correct UPC", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ title: "Test", ingredientId: 1 }),
    });

    await processScannedBarcode("987654321098");

    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("987654321098");
    expect(calledUrl).toContain("spoonacular.com");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("deletePantryItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns Unauthorized when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await deletePantryItem("item-1");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDb.pantryItem.delete).not.toHaveBeenCalled();
  });

  it("deletes item scoped to current user", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.delete.mockResolvedValue({});

    const result = await deletePantryItem("item-1");

    expect(result).toEqual({ success: true });
    expect(mockDb.pantryItem.delete).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-123" },
    });
  });

  it("returns error when delete throws (e.g. item not found / wrong user)", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.delete.mockRejectedValue(new Error("Record not found"));

    const result = await deletePantryItem("nonexistent");
    expect(result).toEqual({ success: false, error: "Failed to delete item." });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("adjustQuantity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns Unauthorized when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await adjustQuantity("item-1", 1);
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("increments quantity for the current user's item", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.update.mockResolvedValue({ ...BASE_ITEM, quantity: 3 });

    const result = await adjustQuantity("item-1", 1);

    expect(result).toEqual({ success: true });
    expect(mockDb.pantryItem.update).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-123" },
      data: { quantity: { increment: 1 } },
    });
  });

  it("decrements quantity (negative amount)", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.update.mockResolvedValue({ ...BASE_ITEM, quantity: 1 });

    await adjustQuantity("item-1", -1);

    expect(mockDb.pantryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: { increment: -1 } } })
    );
  });

  it("clamps quantity to 0 when result drops below 0", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    // First update returns a negative quantity
    mockDb.pantryItem.update
      .mockResolvedValueOnce({ ...BASE_ITEM, quantity: -1 })
      .mockResolvedValueOnce({ ...BASE_ITEM, quantity: 0 });

    const result = await adjustQuantity("item-1", -5);

    expect(result).toEqual({ success: true });
    // Second call should reset to 0
    expect(mockDb.pantryItem.update).toHaveBeenCalledTimes(2);
    expect(mockDb.pantryItem.update).toHaveBeenLastCalledWith({
      where: { id: "item-1" },
      data: { quantity: 0 },
    });
  });

  it("does NOT clamp when quantity stays at or above 0", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.update.mockResolvedValue({ ...BASE_ITEM, quantity: 0 });

    await adjustQuantity("item-1", -1);

    // Only the initial increment call, no clamp reset
    expect(mockDb.pantryItem.update).toHaveBeenCalledTimes(1);
  });

  it("returns error when update throws", async () => {
    mockGetServerSession.mockResolvedValue(VALID_SESSION);
    mockDb.pantryItem.update.mockRejectedValue(new Error("DB error"));

    const result = await adjustQuantity("item-1", 1);
    expect(result).toEqual({ success: false, error: "Update failed" });
  });
});