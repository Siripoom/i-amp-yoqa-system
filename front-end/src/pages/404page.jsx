import { Button } from "antd";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-surface">
      <h1 className="text-6xl font-bold text-text mb-4">404 Not Found</h1>
      <p className="text-text text-lg mb-6">
        Your visited page not found. You may go home page.
      </p>
      <Button
        type="primary"
        className="bg-primary text-white px-6 py-2 rounded-lg"
        onClick={() => navigate("/")}
      >
        Back to home page
      </Button>
    </div>
  );
};

export default NotFoundPage;
