import { Card } from "antd";

// eslint-disable-next-line react/prop-types
const TopProductsTable = ({ products }) => {
  return (
    <Card className="top-products-card">
      <h3 className="card-header">Top Products</h3>
      {products.map((product, index) => (
        <div className="table-row" key={index}>
          <span className="table-cell font-bold">{index + 1}</span>
          <span className="table-cell">{product.name}</span>
          <div className="popularity-bar">
            <div
              className="popularity-bar-fill"
              style={{
                width: `${product.popularity}%`,
                backgroundColor: product.color,
              }}
            ></div>
          </div>
          <span
            className="table-cell font-bold"
            style={{ color: product.color }}
          >
            {product.sales}
          </span>
        </div>
      ))}
    </Card>
  );
};
export default TopProductsTable;
