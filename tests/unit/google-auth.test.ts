import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";
const mocks = vi.hoisted(() => ({
  config: null as NextAuthConfig | null,
  findUnique: vi.fn(),
  rateLimit: vi.fn(),
  demo: false,
}));
vi.mock("next-auth", () => ({
  default: (config: NextAuthConfig) => {
    mocks.config = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/config", () => ({
  get isDemo() {
    return mocks.demo;
  },
}));
import "@/auth";

type Input = Parameters<
  NonNullable<NonNullable<NextAuthConfig["callbacks"]>["signIn"]>
>[0];
function attempt(overrides: Partial<Input> = {}) {
  return mocks.config!.callbacks!.signIn!({
    user: { id: "google-user", email: "Editor@Example.test" },
    account: {
      provider: "google",
      type: "oidc",
      providerAccountId: "google-user",
    },
    profile: { email_verified: true },
    ...overrides,
  });
}
beforeEach(() => {
  mocks.demo = false;
  mocks.findUnique.mockReset().mockResolvedValue({ active: true });
  mocks.rateLimit.mockReset().mockResolvedValue(undefined);
});
describe("Google staff sign-in", () => {
  it("configures Google as the only provider", () => {
    const provider = mocks.config!.providers[0];
    expect(typeof provider === "function" ? provider().id : provider.id).toBe(
      "google",
    );
    expect(mocks.config!.providers).toHaveLength(1);
  });
  it("allows a verified invited active account with normalized email", async () => {
    expect(await attempt()).toBe(true);
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { email: "editor@example.test" },
    });
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      "login:editor@example.test",
      20,
      900000,
    );
  });
  it.each([false, undefined, null])(
    "rejects an unverified or missing verification claim: %s",
    async (verified) => {
      expect(await attempt({ profile: { email_verified: verified } })).toBe(
        false,
      );
      expect(mocks.findUnique).not.toHaveBeenCalled();
    },
  );
  it("rejects missing email", async () => {
    expect(await attempt({ user: { id: "google-user", email: null } })).toBe(
      false,
    );
  });
  it("rejects another identity provider", async () => {
    expect(
      await attempt({
        account: {
          provider: "github",
          type: "oauth",
          providerAccountId: "other",
        },
      }),
    ).toBe(false);
  });
  it("rejects missing profile or account", async () => {
    expect(await attempt({ profile: undefined })).toBe(false);
    expect(await attempt({ account: null })).toBe(false);
  });
  it.each([null, { active: false }])(
    "rejects uninvited or inactive staff",
    async (staff) => {
      mocks.findUnique.mockResolvedValue(staff);
      expect(await attempt()).toBe(false);
    },
  );
  it("blocks demo login without querying staff", async () => {
    mocks.demo = true;
    expect(await attempt()).toBe(false);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("does not bypass login rate limiting", async () => {
    mocks.rateLimit.mockRejectedValue(new Error("Too many requests"));
    await expect(attempt()).rejects.toThrow("Too many requests");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
