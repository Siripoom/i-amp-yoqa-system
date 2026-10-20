import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const { navigate, lineLogin, liff } = vi.hoisted(() => ({
  navigate: vi.fn(),
  lineLogin: vi.fn(),
  liff: {
    init: vi.fn(),
    login: vi.fn(),
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
  liff.login.mockReset();
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
  expect(liff.login).not.toHaveBeenCalled();
});

test("a browser without a LINE session waits for initialization then starts LINE login", async () => {
  let finishInit;
  liff.init.mockReturnValue(new Promise((resolve) => { finishInit = resolve; }));
  liff.isLoggedIn.mockReturnValue(false);
  render(<Line />);
  expect(liff.login).not.toHaveBeenCalled();
  expect(lineLogin).not.toHaveBeenCalled();

  finishInit();
  await waitFor(() => expect(liff.login).toHaveBeenCalledWith());
  expect(lineLogin).not.toHaveBeenCalled();
  expect(localStorage.getItem("token")).toBeNull();
  expect(screen.queryByText("ยังไม่ได้เข้าสู่ระบบผ่าน LINE")).toBeNull();
});

test("initialization failure does not attempt LINE login or the application API", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  liff.init.mockRejectedValue(new Error("Initialization failed"));
  render(<Line />);
  expect(await screen.findByText(/ไม่สามารถเริ่มเข้าสู่ระบบ LINE ได้/)).toBeTruthy();
  expect(liff.login).not.toHaveBeenCalled();
  expect(lineLogin).not.toHaveBeenCalled();
  consoleError.mockRestore();
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

  expect(await screen.findByText(/เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง/)).toBeTruthy();
  expect(localStorage.getItem("token")).toBeNull();
  expect(liff.getProfile).not.toHaveBeenCalled();
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
    "verified-id-token"
  );

  consoleError.mockRestore();
});

test("legacy account explains review without redirecting or storing a session", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  lineLogin.mockRejectedValue({
    response: { data: { code: "LINE_LEGACY_ACCOUNT_REVIEW_REQUIRED" } },
  });
  render(<Line />);

  expect(await screen.findByText(/บัญชี LINE เดิมของคุณต้องให้ผู้ดูแลตรวจสอบ/)).toBeTruthy();
  expect(localStorage.getItem("token")).toBeNull();
  expect(navigate).not.toHaveBeenCalled();
  consoleError.mockRestore();
});
