import AppRouter from "./AppRouter";
import { HelmetProvider } from 'react-helmet-async';

const App = () => {
  return  <HelmetProvider>
      <AppRouter />
    </HelmetProvider>;
};

export default App;
