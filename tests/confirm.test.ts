import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ client: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import { GET } from "@/app/auth/confirm/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ auth: { verifyOtp: mocks.verifyOtp } });
});

it("exchanges email confirmation for a session and redirects to notes", async () => {
  mocks.verifyOtp.mockResolvedValue({ error: null });
  const response = await GET(new NextRequest("https://app.example/auth/confirm?token_hash=token&type=email&next=https://evil.example"));
  expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "token", type: "email" });
  expect(response.headers.get("location")).toBe("https://app.example/notes");
});

it.each(["?type=email", "?token_hash=token&type=recovery", "?token_hash=token&type=email"])("rejects invalid or expired confirmation: %s", async (query) => {
  mocks.verifyOtp.mockResolvedValue({ error: new Error("expired") });
  const response = await GET(new NextRequest(`https://app.example/auth/confirm${query}`));
  expect(response.headers.get("location")).toBe("https://app.example/login?error=confirmation");
});
