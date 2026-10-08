import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ client: vi.fn(), verifyOtp: vi.fn(), exchangeCode: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import { GET } from "@/app/auth/confirm/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ auth: { verifyOtp: mocks.verifyOtp, exchangeCodeForSession: mocks.exchangeCode } });
});

it("exchanges a default template code for a session and ignores external redirects", async () => {
  mocks.exchangeCode.mockResolvedValue({ error: null });
  const response = await GET(new NextRequest("https://app.example/auth/confirm?code=confirmation-code&next=https://evil.example&redirect_to=https://evil.example"));
  expect(mocks.exchangeCode).toHaveBeenCalledWith("confirmation-code");
  expect(mocks.verifyOtp).not.toHaveBeenCalled();
  expect(response.headers.get("location")).toBe("https://app.example/notes");
});

it("verifies a token hash for a session and ignores external redirects", async () => {
  mocks.verifyOtp.mockResolvedValue({ error: null });
  const response = await GET(new NextRequest("https://app.example/auth/confirm?token_hash=token&type=email&next=https://evil.example"));
  expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "token", type: "email" });
  expect(mocks.exchangeCode).not.toHaveBeenCalled();
  expect(response.headers.get("location")).toBe("https://app.example/notes");
});

it.each(["", "?code=", "?type=email", "?token_hash=token", "?token_hash=token&type=recovery", "?error=access_denied&next=https://evil.example"])("rejects incomplete or unsupported confirmation: %s", async (query) => {
  const response = await GET(new NextRequest(`https://app.example/auth/confirm${query}`));
  expect(response.headers.get("location")).toBe("https://app.example/login?error=confirmation");
  expect(mocks.client).not.toHaveBeenCalled();
});

it.each(["?code=expired", "?token_hash=expired&type=email"])("rejects expired or invalid credentials: %s", async (query) => {
  mocks.exchangeCode.mockResolvedValue({ error: new Error("expired") });
  mocks.verifyOtp.mockResolvedValue({ error: new Error("expired") });
  const response = await GET(new NextRequest(`https://app.example/auth/confirm${query}&next=https://evil.example`));
  expect(response.headers.get("location")).toBe("https://app.example/login?error=confirmation");
});

it.each(["?code=token", "?token_hash=token&type=email"])("handles session exchange exceptions: %s", async (query) => {
  mocks.exchangeCode.mockRejectedValue(new Error("network"));
  mocks.verifyOtp.mockRejectedValue(new Error("network"));
  const response = await GET(new NextRequest(`https://app.example/auth/confirm${query}`));
  expect(response.headers.get("location")).toBe("https://app.example/login?error=confirmation");
});

it("handles unavailable Supabase configuration", async () => {
  mocks.client.mockRejectedValue(new Error("missing configuration"));
  const response = await GET(new NextRequest("https://app.example/auth/confirm?code=token"));
  expect(response.headers.get("location")).toBe("https://app.example/login?error=confirmation");
});

it("prioritizes the code without falling back to token hash on failure", async () => {
  mocks.exchangeCode.mockResolvedValue({ error: new Error("expired") });
  const response = await GET(new NextRequest("https://app.example/auth/confirm?code=expired&token_hash=token&type=email"));
  expect(mocks.exchangeCode).toHaveBeenCalledWith("expired");
  expect(mocks.verifyOtp).not.toHaveBeenCalled();
  expect(response.headers.get("location")).toBe("https://app.example/login?error=confirmation");
});
