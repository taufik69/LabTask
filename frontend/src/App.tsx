import { AppProviders } from "@/app/AppProviders";
import AppRoutes from "@/routes/AppRoutes";

const App = () => {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
