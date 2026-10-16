import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import BookingSchedule from "./BookingSchedule";

const event = (id, date, hour) => ({
  id, title: `Yoga ${id}`, date: new Date(2026, 9, date, hour),
  endDate: new Date(2026, 9, date, hour + 1), instructor: "ครูแอมป์",
  difficulty: 2, allowedGender: "all",
});
const events = [event("evening", 12, 18), event("morning", 12, 7), event("tuesday", 13, 8), event("next-week", 19, 9)];
const onShowDetails = vi.fn();
const onBook = vi.fn();
const onRetry = vi.fn();
const renderSchedule = (props = {}) => render(
  <BookingSchedule events={events} loading={false} loadError={false} onRetry={onRetry}
    onShowDetails={onShowDetails}
    renderBookingAction={(item) => <button onClick={() => onBook(item.id)}>จอง {item.title}</button>}
    {...props} />
);

beforeEach(() => {
  const getComputedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => getComputedStyle(element));
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 12, 6));
  vi.clearAllMocks();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

test("shows today's classes in time order, then switches to the selected day", () => {
  renderSchedule();
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("คลาสวันจันทร์ที่ 12 ตุลาคม 2569");
  expect(screen.getAllByRole("article").map((row) => within(row).getByRole("heading").textContent)).toEqual(["Yoga morning", "Yoga evening"]);
  fireEvent.click(screen.getByRole("button", { name: "วันอังคารที่ 13 ตุลาคม 2569" }));
  expect(screen.getByRole("heading", { name: "Yoga tuesday" })).toBeTruthy();
  expect(screen.queryByText("Yoga morning")).toBeNull();
});

test("week arrows preserve the weekday and show the matching classes", () => {
  renderSchedule();
  fireEvent.click(screen.getByRole("button", { name: "สัปดาห์ถัดไป" }));
  expect(screen.getByRole("heading", { name: "Yoga next-week" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "สัปดาห์ก่อนหน้า" }));
  expect(screen.getByRole("heading", { name: "Yoga morning" })).toBeTruthy();
});

test("month calendar marks class days and selects a date across a month boundary", () => {
  renderSchedule();
  fireEvent.click(screen.getByRole("button", { name: "ดูตารางทั้งเดือน" }));
  const calendar = screen.getByRole("dialog");
  expect(within(calendar).getByRole("button", { name: "วันอังคารที่ 13 ตุลาคม 2569 มีคลาส" })).toBeTruthy();
  fireEvent.click(within(calendar).getByRole("button", { name: "เดือนถัดไป" }));
  fireEvent.click(within(calendar).getByRole("button", { name: "วันอาทิตย์ที่ 1 พฤศจิกายน 2569" }));
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("คลาสวันอาทิตย์ที่ 1 พฤศจิกายน 2569");
  expect(screen.getByText("ยังไม่มีคลาสในวันนี้")).toBeTruthy();
});

test("details and booking actions retain the selected class identity", () => {
  renderSchedule();
  fireEvent.click(screen.getByRole("button", { name: "ดูรายละเอียด Yoga evening" }));
  expect(onShowDetails).toHaveBeenCalledWith("evening");
  fireEvent.click(screen.getByRole("button", { name: "จอง Yoga morning" }));
  expect(onBook).toHaveBeenCalledWith("morning");
});

test("loading and failed requests do not show a misleading empty schedule", () => {
  const { rerender } = renderSchedule({ loading: true });
  expect(screen.getByRole("status").textContent).toContain("กำลังโหลด");
  expect(screen.queryByText("ยังไม่มีคลาสในวันนี้")).toBeNull();
  rerender(<BookingSchedule events={[]} loading={false} loadError onRetry={onRetry} onShowDetails={onShowDetails} renderBookingAction={() => null} />);
  expect(screen.getByRole("alert").textContent).toContain("ไม่สามารถโหลด");
  fireEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  expect(onRetry).toHaveBeenCalledOnce();
});
