import { useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "antd";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, UserRound } from "lucide-react";
import moment from "moment";
import "moment/locale/th";

const weekdays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
const thaiDate = (date) => date.toDate().toLocaleDateString("th-TH", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

export default function BookingSchedule({ events, loading, loadError, onRetry, onShowDetails, renderBookingAction }) {
  const [selectedDate, setSelectedDate] = useState(() => moment().startOf("day"));
  const [month, setMonth] = useState(() => moment().startOf("month"));
  const [monthOpen, setMonthOpen] = useState(false);
  const weekStart = selectedDate.clone().startOf("isoWeek");
  const days = Array.from({ length: 7 }, (_, index) => weekStart.clone().add(index, "days"));
  const dayEvents = events
    .filter((event) => moment(event.date).isSame(selectedDate, "day"))
    .sort((a, b) => a.date - b.date);
  const eventDates = new Set(events.map((event) => moment(event.date).format("YYYY-MM-DD")));
  const calendarStart = month.clone().startOf("isoWeek");
  const calendarDays = Array.from({ length: 42 }, (_, index) => calendarStart.clone().add(index, "days"));

  return (
    <section className="booking-schedule" aria-label="ตารางจองคลาส">
      <nav className="booking-week" aria-label="เลือกวันเรียน">
        <button className="booking-arrow" aria-label="สัปดาห์ก่อนหน้า" onClick={() => setSelectedDate(selectedDate.clone().subtract(1, "week"))}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <div className="booking-week-days">
          {days.map((day, index) => (
            <button
              key={day.format("YYYY-MM-DD")}
              className={`booking-day booking-day-${index}${day.isSame(selectedDate, "day") ? " is-selected" : ""}`}
              aria-label={thaiDate(day)}
              aria-pressed={day.isSame(selectedDate, "day")}
              aria-current={day.isSame(moment(), "day") ? "date" : undefined}
              onClick={() => setSelectedDate(day)}
            >
              <span>{weekdays[index]}</span>
              <strong>{day.date()}</strong>
              <span>{day.toDate().toLocaleDateString("th-TH", { month: "short" })}</span>
            </button>
          ))}
        </div>
        <button className="booking-arrow" aria-label="สัปดาห์ถัดไป" onClick={() => setSelectedDate(selectedDate.clone().add(1, "week"))}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </nav>

      <div className="booking-date-heading">
        <h2 id="booking-selected-date" aria-live="polite">คลาส{thaiDate(selectedDate)}</h2>
        <button className="booking-month-toggle" onClick={() => { setMonth(selectedDate.clone().startOf("month")); setMonthOpen(true); }}>
          ดูตารางทั้งเดือน <CalendarDays size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="booking-class-list" aria-labelledby="booking-selected-date" aria-busy={loading}>
        {loading ? (
          <div className="booking-empty" role="status">กำลังโหลดข้อมูลคลาส...</div>
        ) : loadError ? (
          <div className="booking-empty" role="alert">
            <p>ไม่สามารถโหลดตารางคลาสได้</p>
            <button className="booking-month-toggle" onClick={onRetry}>ลองอีกครั้ง</button>
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="booking-empty" role="status">
            <CalendarDays size={28} aria-hidden="true" />
            <p>ยังไม่มีคลาสในวันนี้</p>
            <span>เลือกวันอื่น หรือดูตารางทั้งเดือนเพื่อค้นหาคลาส</span>
          </div>
        ) : dayEvents.map((event) => (
          <article className="booking-class-row" key={event.id}>
            <div className="booking-class-time">
              <Clock3 size={20} strokeWidth={1.5} aria-hidden="true" />
              <span>{moment(event.date).format("HH:mm")} – {moment(event.endDate).format("HH:mm")}</span>
            </div>
            <button className="booking-class-summary" onClick={() => onShowDetails(event.id)} aria-label={`ดูรายละเอียด ${event.title}`}>
              <h3>{event.title}</h3>
              <span><UserRound size={14} strokeWidth={1.5} aria-hidden="true" />{event.instructor || "รอยืนยันครูผู้สอน"}</span>
            </button>
            <div className="booking-class-badges">
              <span className="booking-count">จองแล้ว {event.participants?.length ?? 0} คน</span>
              {event.allowedGender !== "all" && <span className="booking-gender">{event.allowedGender === "female" ? "เฉพาะหญิง" : "เฉพาะชาย"}</span>}
            </div>
            <div className="booking-class-action">{renderBookingAction(event)}</div>
          </article>
        ))}
      </div>

      <Modal open={monthOpen} onCancel={() => setMonthOpen(false)} footer={null} title="ตารางคลาสทั้งเดือน" className="booking-calendar-modal">
        <div className="booking-calendar-header">
          <button className="booking-arrow" aria-label="เดือนก่อนหน้า" onClick={() => setMonth(month.clone().subtract(1, "month"))}><ChevronLeft size={18} /></button>
          <h3 aria-live="polite">{month.toDate().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</h3>
          <button className="booking-arrow" aria-label="เดือนถัดไป" onClick={() => setMonth(month.clone().add(1, "month"))}><ChevronRight size={18} /></button>
        </div>
        <div className="booking-calendar-grid">
          {weekdays.map((day) => <span className="booking-calendar-weekday" key={day}>{day}</span>)}
          {calendarDays.map((day) => {
            const hasClasses = eventDates.has(day.format("YYYY-MM-DD"));
            return (
              <button
                key={day.format("YYYY-MM-DD")}
                className={`booking-calendar-day${day.isSame(month, "month") ? "" : " is-outside"}${day.isSame(selectedDate, "day") ? " is-selected" : ""}`}
                aria-label={`${thaiDate(day)}${hasClasses ? " มีคลาส" : ""}`}
                aria-pressed={day.isSame(selectedDate, "day")}
                aria-current={day.isSame(moment(), "day") ? "date" : undefined}
                onClick={() => { setSelectedDate(day); setMonthOpen(false); }}
              >
                {day.date()}
                {hasClasses && <span className="booking-calendar-dot" />}
              </button>
            );
          })}
        </div>
        <p className="booking-calendar-legend"><span className="booking-calendar-dot" /> วันที่มีคลาส · เลือกวันเพื่อดูเวลาและจอง</p>
      </Modal>
    </section>
  );
}

BookingSchedule.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.instanceOf(Date).isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
    instructor: PropTypes.string,
    participants: PropTypes.arrayOf(PropTypes.string),
    allowedGender: PropTypes.string,
  })).isRequired,
  loading: PropTypes.bool.isRequired,
  loadError: PropTypes.bool.isRequired,
  onRetry: PropTypes.func.isRequired,
  onShowDetails: PropTypes.func.isRequired,
  renderBookingAction: PropTypes.func.isRequired,
};
