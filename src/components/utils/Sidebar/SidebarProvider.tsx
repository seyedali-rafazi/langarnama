import { Anchor, Close } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const COLLAPSED_WIDTH = 72;
export const EXPANDED_WIDTH = 360;
const PANEL_WIDTH = EXPANDED_WIDTH - COLLAPSED_WIDTH;

const MONO = '"JetBrains Mono", "Cascadia Code", "Roboto Mono", monospace';

const SidebarContext = createContext(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children, config }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeComponentId, setActiveComponentId] = useState(null);

  const openSidebar = useCallback((id) => {
    const item = config.find((i) => i.id === id);
    if (item && item.component) {
      setIsExpanded(true);
      setActiveComponentId(id);
    }
  }, [config]);

  const closeSidebar = useCallback(() => {
    setIsExpanded(false);
    setActiveComponentId(null);
  }, []);

  const toggleSidebar = useCallback((id) => {
    if (isExpanded && activeComponentId === id) {
      closeSidebar();
    } else {
      openSidebar(id);
    }
  }, [isExpanded, activeComponentId, closeSidebar, openSidebar]);

  const handleSidebarClick = useCallback((item) => {
    if (item.navigate) {
      closeSidebar();
      navigate(item.navigate);
    } else if (item.component) {
      toggleSidebar(item.id);
    }
  }, [closeSidebar, navigate, toggleSidebar]);

  const topItems = config.filter(
    (item) => item.position === "top" || !item.position
  );
  const bottomItems = config.filter((item) => item.position === "bottom");

  const activeItem = config.find((i) => i.id === activeComponentId);

  const renderItems = (items) => (
    <Stack spacing={1} alignItems="center">
      {items.map((item) => {
        const isActive =
          activeComponentId === item.id ||
          location.pathname === item.navigate ||
          (item.navigate &&
            item.navigate !== "/" &&
            location.pathname.startsWith(item.navigate));

        return (
          <Tooltip
            key={item.id}
            title={item.textButton}
            placement="right"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: "#0b1117",
                  border: "1px solid rgba(34,211,238,0.35)",
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: MONO,
                  fontSize: "0.62rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  px: 1.25,
                  py: 0.5,
                },
              },
              arrow: { sx: { color: "#0b1117" } },
            }}
          >
            <Box
              onClick={() => handleSidebarClick(item)}
              role="button"
              aria-label={item.textButton}
              sx={{
                position: "relative",
                width: 46,
                height: 46,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderRadius: "14px",
                color: isActive ? "#22d3ee" : "rgba(255,255,255,0.45)",
                bgcolor: isActive ? "rgba(34,211,238,0.1)" : "transparent",
                boxShadow: isActive
                  ? "inset 0 0 0 1px rgba(34,211,238,0.4), 0 0 18px rgba(34,211,238,0.12)"
                  : "inset 0 0 0 1px transparent",
                transition: "all 0.22s ease",
                "&:hover": {
                  color: isActive ? "#22d3ee" : "rgba(255,255,255,0.85)",
                  bgcolor: isActive
                    ? "rgba(34,211,238,0.14)"
                    : "rgba(255,255,255,0.05)",
                },
                "& .MuiSvgIcon-root": { fontSize: 21 },
                // active edge notch on the rail
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: -13,
                  top: "50%",
                  transform: isActive
                    ? "translateY(-50%) scaleY(1)"
                    : "translateY(-50%) scaleY(0)",
                  width: 3,
                  height: 26,
                  borderRadius: "0 3px 3px 0",
                  bgcolor: "#22d3ee",
                  boxShadow: "0 0 10px rgba(34,211,238,0.8)",
                  transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                },
              }}
            >
              {item.icon}
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );

  const contextValue = useMemo(
    () => ({
      isExpanded,
      sidebarWidth: COLLAPSED_WIDTH,
      activeComponentId,
      openSidebar,
      closeSidebar,
      toggleSidebar,
    }),
    [isExpanded, activeComponentId, openSidebar, closeSidebar, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <Box sx={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            width: COLLAPSED_WIDTH,
            flexShrink: 0,
            height: "100%",
            position: "relative",
            zIndex: 1400,
            overflow: "hidden",
          }}
        >
          {/* command rail */}
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              width: COLLAPSED_WIDTH,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 1.75,
              px: "13px",
              background: "linear-gradient(180deg, #0f161c 0%, #0a0e12 100%)",
              borderRight: "1px solid rgba(34,211,238,0.12)",
            }}
          >
            {/* brand emblem */}
            <Box
              sx={{
                position: "relative",
                width: 44,
                height: 44,
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                background:
                  "linear-gradient(140deg, rgba(6,182,212,0.25) 0%, rgba(6,182,212,0.06) 100%)",
                border: "1px solid rgba(34,211,238,0.4)",
                boxShadow: "0 0 22px rgba(6,182,212,0.18)",
              }}
            >
              <Anchor sx={{ fontSize: 23, color: "#22d3ee" }} />
              <Box
                sx={{
                  position: "absolute",
                  right: -2,
                  top: -2,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: "#22c55e",
                  border: "2px solid #0a0e12",
                  animation: "rail-live 2.2s ease-in-out infinite",
                  "@keyframes rail-live": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.6)" },
                    "50%": { boxShadow: "0 0 0 4px rgba(34,197,94,0)" },
                  },
                }}
              />
            </Box>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.5rem",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.35)",
                mb: 1.5,
              }}
            >
              LNGR
            </Typography>

            <Box
              sx={{
                width: 30,
                height: "1px",
                mb: 1.5,
                background:
                  "linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)",
              }}
            />

            <Box sx={{ flex: 1, width: "100%" }}>{renderItems(topItems)}</Box>

            <Box
              sx={{
                width: 30,
                height: "1px",
                my: 1.5,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
              }}
            />
            {renderItems(bottomItems)}
          </Box>

          {/* slide-out panel */}
          <Box
            sx={{
              position: "fixed",
              left: COLLAPSED_WIDTH,
              top: 0,
              bottom: 0,
              width: PANEL_WIDTH,
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              bgcolor: "rgba(13,19,25,0.96)",
              backdropFilter: "blur(14px)",
              borderRight: "1px solid rgba(34,211,238,0.14)",
              boxShadow: isExpanded ? "12px 0 40px rgba(0,0,0,0.55)" : "none",
              transform: isExpanded ? "translateX(0)" : `translateX(-${PANEL_WIDTH}px)`,
              visibility: isExpanded ? "visible" : "hidden",
              transition:
                "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, visibility 0.3s",
              pointerEvents: isExpanded ? "auto" : "none",
              overflow: "hidden",
            }}
          >
            {activeItem && (
              <>
                <Box
                  sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 1.75,
                    borderBottom: "1px solid rgba(34,211,238,0.12)",
                    flexShrink: 0,
                    background:
                      "linear-gradient(180deg, rgba(34,211,238,0.05) 0%, transparent 100%)",
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.55rem",
                          letterSpacing: "0.22em",
                          color: "rgba(34,211,238,0.75)",
                          mb: 0.25,
                        }}
                      >
                        {"// CONTROL MODULE"}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                        {activeItem.textButton}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={closeSidebar}
                      sx={{
                        color: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "10px",
                        "&:hover": {
                          color: "#22d3ee",
                          borderColor: "rgba(34,211,238,0.45)",
                          bgcolor: "rgba(34,211,238,0.08)",
                        },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    px: 2.5,
                    py: 2,
                    color: "text.primary",
                    minHeight: 0,
                  }}
                >
                  {activeItem.component}
                </Box>
              </>
            )}
          </Box>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            overflow: "hidden",
            bgcolor: "background.default",
          }}
        >
          {children}
        </Box>
      </Box>
    </SidebarContext.Provider>
  );
};
