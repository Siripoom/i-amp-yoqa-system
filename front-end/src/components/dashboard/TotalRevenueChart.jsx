import { Card } from "antd";
import { Bar } from "react-chartjs-2";

const TotalRevenueChart = ({ revenueData }) => {
  return (
    <Card className="total-revenue-card">
      <h3 className="card-header">Total Revenue</h3>
      <Bar
        className="total-revenue-chart"
        data={revenueData}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
          },
        }}
      />
    </Card>
  );
};

export default TotalRevenueChart;
