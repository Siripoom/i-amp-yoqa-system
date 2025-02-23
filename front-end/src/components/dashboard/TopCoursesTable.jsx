import { Card } from "antd";

const TopCoursesTable = ({ courses }) => {
  return (
    <Card className="top-courses-card">
      <h3 className="card-header">Top Courses</h3>
      {courses.map((course, index) => (
        <div className="table-row" key={index}>
          <span className="table-cell font-bold">{index + 1}</span>
          <span className="table-cell">{course.name}</span>
          <div className="popularity-bar">
            <div
              className="popularity-bar-fill"
              style={{
                width: `${course.popularity}%`,
                backgroundColor: course.color,
              }}
            ></div>
          </div>
          <span
            className="table-cell font-bold"
            style={{ color: course.color }}
          >
            {course.sales}
          </span>
        </div>
      ))}
    </Card>
  );
};
export default TopCoursesTable;
