import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { message } from "antd";
const api = vi.hoisted(() => ({ getLegacyLineMembers: vi.fn(), approveLegacyLineMember: vi.fn() }));
vi.mock("../services/userService", () => api);
import LegacyLineMembers from "./LegacyLineMembers";

const member = { _id: "member-1", username: `U${"a".repeat(32)}`, first_name: "สมาชิกทดสอบ", email: "member@example.com", phone: "0800000000", remaining_session: 12 };
beforeEach(() => {
  const getComputedStyle = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation(element => getComputedStyle(element));
  Object.defineProperty(window, "matchMedia", { writable: true, value: vi.fn().mockImplementation(() => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
  api.getLegacyLineMembers.mockReset().mockResolvedValue({ members: [member], total: 1 });
  api.approveLegacyLineMember.mockReset().mockResolvedValue({ member });
});
afterEach(() => { cleanup(); message.destroy(); vi.restoreAllMocks(); });

test("operator must review and confirm before linking the selected original member", async () => {
  render(<LegacyLineMembers />);
  fireEvent.click(await screen.findByRole("button", { name: "ตรวจสอบและเชื่อมต่อ" }));
  const approve = screen.getByRole("button", { name: "ยืนยันเชื่อมต่อ LINE" });
  expect(approve.disabled).toBe(true);
  expect(screen.getByText(member.username)).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/วิธีตรวจสอบเจ้าของบัญชี/), { target: { value: "ตรวจสอบรหัสสมาชิกและเบอร์โทรแล้ว" } });
  expect(approve.disabled).toBe(true);
  fireEvent.click(screen.getByRole("checkbox"));
  expect(approve.disabled).toBe(false);
  fireEvent.click(approve);
  await waitFor(() => expect(api.approveLegacyLineMember).toHaveBeenCalledWith("member-1", {
    expectedLineUserId: member.username, confirmed: true, note: "ตรวจสอบรหัสสมาชิกและเบอร์โทรแล้ว",
  }));
  await waitFor(() => expect(api.getLegacyLineMembers).toHaveBeenCalledTimes(2));
});

test("failed linking keeps review open and shows conflict", async () => {
  api.approveLegacyLineMember.mockRejectedValue({ response: { data: { code: "LINE_IDENTITY_CONFLICT" } } });
  render(<LegacyLineMembers />);
  fireEvent.click(await screen.findByRole("button", { name: "ตรวจสอบและเชื่อมต่อ" }));
  fireEvent.change(screen.getByLabelText(/วิธีตรวจสอบเจ้าของบัญชี/), { target: { value: "ตรวจสอบสมาชิกแล้ว" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "ยืนยันเชื่อมต่อ LINE" }));
  expect(await screen.findByText(/พบสมาชิกอื่นใช้ LINE ID เดียวกัน/)).toBeTruthy();
  expect(screen.getByRole("dialog")).toBeTruthy();
});

test("directory failures are visible and can be retried", async () => {
  api.getLegacyLineMembers.mockRejectedValueOnce(new Error("Network error"));
  render(<LegacyLineMembers />);
  expect(await screen.findByText(/โหลดรายการบัญชี LINE ไม่สำเร็จ/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "โหลดใหม่" }));
  expect(await screen.findByText("สมาชิกทดสอบ")).toBeTruthy();
});
