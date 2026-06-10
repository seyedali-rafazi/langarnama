import {
  Anchor,
  DirectionsBoat,
  Search,
  Sensors,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { SHIP_TYPE_CONFIG, type Ship } from "../ShipLayer/types/Ship";
import type { Port } from "../PortLayer/types/Port";
import type { CoastalStation } from "../StationLayer/types/CoastalStation";
import {
  useMapLayers,
  type LayerCategory,
} from "../../context/MapLayersContext";

const CATEGORY_CONFIG: Record<
  LayerCategory,
  { label: string; icon: ReactNode; color: string }
> = {
  ships: { label: "Ships", icon: <DirectionsBoat fontSize="small" />, color: "#22d3ee" },
  ports: { label: "Ports", icon: <Anchor fontSize="small" />, color: "#22d3ee" },
  stations: { label: "Stations", icon: <Sensors fontSize="small" />, color: "#a78bfa" },
};

function getItemLabel(category: LayerCategory, item: Ship | Port | CoastalStation) {
  if (category === "ships") {
    const s = item as Ship;
    return {
      primary: s.name,
      secondary: `${SHIP_TYPE_CONFIG[s.shipType].label} · ${s.operator}`,
    };
  }
  if (category === "ports") {
    const p = item as Port;
    return { primary: p.name, secondary: `${p.locode} · ${p.city}` };
  }
  const s = item as CoastalStation;
  return { primary: s.name, secondary: `${s.type} · ${s.status}` };
}

function matchesSearch(
  category: LayerCategory,
  item: Ship | Port | CoastalStation,
  query: string
) {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const { primary, secondary } = getItemLabel(category, item);
  return (
    primary.toLowerCase().includes(q) ||
    secondary.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q)
  );
}

export default function LayersPanel() {
  const {
    activeCategory,
    setActiveCategory,
    categoryEnabled,
    toggleCategory,
    isItemVisible,
    toggleItemVisibility,
    setCategoryItemsVisibility,
    searchQuery,
    setSearchQuery,
    selectedEntity,
    selectEntity,
    ships,
    ports,
    stations,
    getEntityData,
  } = useMapLayers();

  const items = useMemo(() => {
    const data =
      activeCategory === "ships"
        ? ships
        : activeCategory === "ports"
          ? ports
          : stations;
    return data.filter((item) =>
      matchesSearch(activeCategory, item, searchQuery[activeCategory])
    );
  }, [activeCategory, ships, ports, stations, searchQuery]);

  const visibleCount = items.filter((item) =>
    isItemVisible(activeCategory, item.id)
  ).length;

  const selectedData = selectedEntity
    ? getEntityData(selectedEntity.category, selectedEntity.id)
    : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ToggleButtonGroup
        value={activeCategory}
        exclusive
        fullWidth
        size="small"
        onChange={(_, value: LayerCategory | null) => {
          if (value) setActiveCategory(value);
        }}
        sx={{ mb: 2 }}
      >
        {(Object.keys(CATEGORY_CONFIG) as LayerCategory[]).map((cat) => (
          <ToggleButton key={cat} value={cat} sx={{ py: 0.75, fontSize: "0.7rem" }}>
            <Stack alignItems="center" spacing={0.25}>
              {CATEGORY_CONFIG[cat].icon}
              <span>{CATEGORY_CONFIG[cat].label}</span>
            </Stack>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            size="small"
            checked={categoryEnabled[activeCategory]}
            onChange={() => toggleCategory(activeCategory)}
          />
          <Typography variant="caption" color="text.secondary">
            Show {CATEGORY_CONFIG[activeCategory].label}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {visibleCount}/{items.length}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
        <IconButton
          size="small"
          title="Show all"
          onClick={() => setCategoryItemsVisibility(activeCategory, true)}
          sx={{ bgcolor: "grey.A100" }}
        >
          <Visibility fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          title="Hide all"
          onClick={() => setCategoryItemsVisibility(activeCategory, false)}
          sx={{ bgcolor: "grey.A100" }}
        >
          <VisibilityOff fontSize="small" />
        </IconButton>
      </Stack>

      <TextField
        size="small"
        placeholder={`Search ${CATEGORY_CONFIG[activeCategory].label.toLowerCase()}...`}
        value={searchQuery[activeCategory]}
        onChange={(e) => setSearchQuery(activeCategory, e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: "text.secondary" }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1.5 }}
      />

      <List
        disablePadding
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          mb: selectedData ? 1 : 0,
        }}
      >
        {items.map((item) => {
          const { primary, secondary } = getItemLabel(activeCategory, item);
          const visible = isItemVisible(activeCategory, item.id);
          const isSelected =
            selectedEntity?.category === activeCategory &&
            selectedEntity?.id === item.id;
          const typeColor =
            activeCategory === "ships"
              ? SHIP_TYPE_CONFIG[(item as Ship).shipType].color
              : null;

          return (
            <ListItemButton
              key={item.id}
              selected={isSelected}
              onClick={() => selectEntity(activeCategory, item.id)}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                opacity: visible ? 1 : 0.45,
                border: "1px solid",
                borderColor: isSelected ? "primary.main" : "transparent",
              }}
            >
              {typeColor && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: typeColor,
                    mr: 1,
                    flexShrink: 0,
                  }}
                />
              )}
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {primary}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {secondary}
                  </Typography>
                }
                sx={{ pr: 1 }}
              />
              <IconButton
                size="small"
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItemVisibility(activeCategory, item.id);
                }}
                sx={{ color: visible ? "primary.main" : "text.secondary" }}
              >
                {visible ? (
                  <Visibility fontSize="small" />
                ) : (
                  <VisibilityOff fontSize="small" />
                )}
              </IconButton>
            </ListItemButton>
          );
        })}
      </List>

      {selectedData && selectedEntity && (
        <>
          <Divider sx={{ mb: 1 }} />
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "grey.A100",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
              {CATEGORY_CONFIG[selectedEntity.category].icon}
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                SELECTED
              </Typography>
              <Chip
                label={selectedEntity.id}
                size="small"
                sx={{ height: 18, fontSize: "0.6rem", ml: "auto" }}
              />
            </Stack>
            {selectedEntity.category === "ships" && (
              <>
                <Typography variant="body2" fontWeight={700}>
                  {(selectedData as Ship).name}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                  <Chip
                    label={SHIP_TYPE_CONFIG[(selectedData as Ship).shipType].label}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.6rem",
                      bgcolor: SHIP_TYPE_CONFIG[(selectedData as Ship).shipType].color,
                      color: "#0b1117",
                      fontWeight: 700,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(selectedData as Ship).operator}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {(selectedData as Ship).origin_port} → {(selectedData as Ship).destination_port}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {(selectedData as Ship).speed_kts} kn · Draft {(selectedData as Ship).draft_m} m
                </Typography>
              </>
            )}
            {selectedEntity.category === "ports" && (
              <>
                <Typography variant="body2" fontWeight={700}>
                  {(selectedData as Port).name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {(selectedData as Port).locode}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {(selectedData as Port).city} · {(selectedData as Port).berths} berths
                </Typography>
              </>
            )}
            {selectedEntity.category === "stations" && (
              <>
                <Typography variant="body2" fontWeight={700}>
                  {(selectedData as CoastalStation).name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {(selectedData as CoastalStation).type} · {(selectedData as CoastalStation).frequency}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Range: {(selectedData as CoastalStation).range_nm} NM · {(selectedData as CoastalStation).status}
                </Typography>
              </>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
