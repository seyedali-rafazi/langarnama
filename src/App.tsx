import {
  DirectionsBoat,
  HomeOutlined,
  Layers,
  Settings,
  Timeline,
} from "@mui/icons-material";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "./store";
import SettingsPanel from "./pages/Settings/SettingsPanel";
import AppShell from "./components/layout/AppShell";
import WaveLoader from "./components/utils/Loading/WaveLoader";
import { SidebarProvider } from "./components/utils/Sidebar/SidebarProvider";
import WakesPanel from "./pages/Home/components/ShipLayer/components/WakesPanel/WakesPanel";
import { ShipProvider } from "./pages/Home/components/ShipLayer/context/ShipContext";
import LayersPanel from "./pages/Home/components/LayersPanel/LayersPanel";
import { MapLayersProvider } from "./pages/Home/context/MapLayersContext";
import { WatchlistProvider } from "./pages/Ship/context/WatchlistContext";

const ShipListPage = lazy(() => import("./pages/Ship/ShipListPage"));
const ShipDetailPage = lazy(() => import("./pages/Ship/ShipDetailPage"));

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0d1216",
      paper: "#161d22",
    },
    primary: {
      main: "#06b6d4",
      light: "#22d3ee",
    },
    divider: "rgba(255, 255, 255, 0.08)",
    text: {
      primary: "rgba(255, 255, 255, 0.92)",
      secondary: "rgba(255, 255, 255, 0.55)",
    },
    grey: { A100: "#222b32" },
  },
  shape: {
    borderRadius: 10,
  },
  transitions: {
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
});

const sidebarConfig = [
  {
    id: "home",
    textButton: "Home",
    position: "top",
    navigate: "/",
    icon: <HomeOutlined />,
  },
  {
    id: "ship",
    textButton: "Ships",
    position: "top",
    navigate: "/ship",
    icon: <DirectionsBoat />,
  },
  {
    id: "layers",
    textButton: "Layers",
    position: "top",
    component: <LayersPanel />,
    icon: <Layers />,
  },
  {
    id: "wakes",
    textButton: "Wakes",
    position: "top",
    component: <WakesPanel />,
    icon: <Timeline />,
  },
  {
    id: "setting",
    textButton: "Setting",
    component: <SettingsPanel />,
    position: "bottom",
    icon: <Settings />,
  },
];

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <ShipProvider>
            <MapLayersProvider>
              <WatchlistProvider>
                <SidebarProvider config={sidebarConfig}>
                  <Routes>
                    <Route element={<AppShell />}>
                      <Route index element={null} />
                      <Route
                        path="ship"
                        element={
                          <Suspense fallback={<WaveLoader label="LOADING REGISTRY" />}>
                            <ShipListPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="ship/:id"
                        element={
                          <Suspense fallback={<WaveLoader label="RETRIEVING VESSEL" />}>
                            <ShipDetailPage />
                          </Suspense>
                        }
                      />
                    </Route>
                  </Routes>
                </SidebarProvider>
              </WatchlistProvider>
            </MapLayersProvider>
          </ShipProvider>
        </Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
