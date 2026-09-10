import { colors } from "../theme/tokens.js";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const CourseCalendar = ({ events, onSelectEvent }) => {
  // ฟังก์ชันกำหนดสีของอีเวนต์
  const eventPropGetter = (event) => {
    const style = {
      backgroundColor: event.reserved ? colors["success"] : colors["primary"], // สีเขียวเมื่อจองแล้ว
      color: "white",
      borderRadius: "4px",
      border: "none",
      padding: "4px",
    };
    return { style };
  };

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500, padding: "10px", borderRadius: "8px" }}
      onSelectEvent={onSelectEvent} // ส่งค่ากลับไปที่ parent component
      eventPropGetter={eventPropGetter}
    />
  );
};

export default CourseCalendar;
