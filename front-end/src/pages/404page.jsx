import { Button } from "antd";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-pink-100 via-pink-200 to-purple-100">
      <h1 className="text-6xl font-bold text-black mb-4">404 Not Found</h1>
      <p className="text-gray-700 text-lg mb-6">
        Your visited page not found. You may go home page.
      </p>
      <Button
        type="primary"
        className="bg-purple-500 text-white px-6 py-2 rounded-lg"
        onClick={() => navigate("/")}
      >
        Back to home page
      </Button>
    </div>
  );
};

export default NotFoundPage;
