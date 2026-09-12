import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const { navigate, lineLogin, liff } = vi.hoisted(() => ({
  navigate: vi.fn(),
  lineLogin: vi.fn(),
  liff: {
    init: vi.fn(),
    isLoggedIn: vi.fn(),
    getIDToken: vi.fn(),
    getProfile: vi.fn(),
  },
}));

vi.mock("@line/liff", () => ({ default: liff }));
vi.mock("../services/authService", () => ({ lineLogin }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("antd", () => ({
  message: { success: vi.fn(), error: vi.fn() },
}));

import Line from "./Line";

beforeEach(() => {
  localStorage.clear();
  navigate.mockReset();
  lineLogin.mockReset();
  liff.init.mockReset().mockResolvedValue(undefined);
  liff.isLoggedIn.mockReset().mockReturnValue(true);
  liff.getIDToken.mockReset().mockReturnValue("verified-id-token");
  liff.getProfile.mockReset().mockResolvedValue({
    userId: "U-browser-controlled",
    displayName: "Browser Profile",
  });
  lineLogin.mockResolvedValue({
    token: "application-jwt",
    data: {
      _id: "member-1",
      first_name: "Member",
      role_id: "Member",
      userTerms: true,
    },
  });
});

afterEach(cleanup);

test("LINE login sends the raw ID token and never uses browser profile as proof", async () => {
  render(<Line />);

  await waitFor(() => {
    expect(lineLogin).toHaveBeenCalledWith("verified-id-token");
  });

  expect(liff.getProfile).not.toHaveBeenCalled();
  expect(localStorage.getItem("token")).toBe("application-jwt");
  expect(navigate).toHaveBeenCalledWith("/");
});

test("rejected LINE login exposes no token in logs or application state", async () => {
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const rejectedRequest = new Error("request rejected");
  rejectedRequest.config = {
    data: JSON.stringify({ idToken: "verified-id-token" }),
  };
  lineLogin.mockRejectedValue(rejectedRequest);

  render(<Line />);

  expect(await screen.findByText("Login failed. Please try again.")).toBeTruthy();
  expect(localStorage.getItem("token")).toBeNull();
  expect(liff.getProfile).not.toHaveBeenCalled();
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
    "verified-id-token"
  );

  consoleError.mockRestore();
});
