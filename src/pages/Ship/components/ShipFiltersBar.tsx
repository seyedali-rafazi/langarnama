import { FilterList, Search } from "@mui/icons-material";
import {
  Box,
  Collapse,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { getShipTypeConfig } from "../../Home/components/ShipLayer/types/Ship";
import {
  MAX_SPEED_KTS,
  type ShipFilters,
  type SortDirection,
  type SortField,
} from "../utils/shipFilters";

interface ShipFiltersBarProps {
  filters: ShipFilters;
  onFiltersChange: (filters: ShipFilters) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  operators: string[];
  shipTypes: string[];
  resultCount: number;
  totalCount: number;
}

const filterIconButtonSx = (active: boolean) => ({
  width: 42,
  height: 42,
  flexShrink: 0,
  alignSelf: "center",
  borderRadius: 2,
  border: "1px solid",
  borderColor: active ? "primary.main" : "rgba(255,255,255,0.12)",
  bgcolor: active ? "primary.main" : "rgba(255,255,255,0.06)",
  color: active ? "#fff" : "text.secondary",
  transition: "all 0.2s ease",
  "&:hover": {
    bgcolor: active ? "primary.dark" : "rgba(255,255,255,0.1)",
    borderColor: active ? "primary.dark" : "rgba(255,255,255,0.2)",
  },
  "& .MuiSvgIcon-root": {
    fontSize: 22,
  },
});

export default function ShipFiltersBar({
  filters,
  onFiltersChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  operators,
  shipTypes,
  resultCount,
  totalCount,
}: ShipFiltersBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const update = (patch: Partial<ShipFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const speedSlider = (
    <Box>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        Speed range (knots)
      </Typography>
      <Slider
        value={[filters.minSpeed, filters.maxSpeed]}
        onChange={(_, value) => {
          const [min, max] = value as number[];
          update({ minSpeed: min, maxSpeed: max });
        }}
        min={0}
        max={MAX_SPEED_KTS}
        step={1}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `${v} kn`}
        sx={{ mt: 1 }}
      />
    </Box>
  );

  const filterSelects = (
    <>
      <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? undefined : 160 }}>
        <InputLabel>Operator</InputLabel>
        <Select
          label="Operator"
          value={filters.operator}
          onChange={(e) => update({ operator: e.target.value })}
        >
          <MenuItem value="all">All Operators</MenuItem>
          {operators.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? undefined : 150 }}>
        <InputLabel>Vessel Type</InputLabel>
        <Select
          label="Vessel Type"
          value={filters.shipType}
          onChange={(e) => update({ shipType: e.target.value })}
        >
          <MenuItem value="all">All Types</MenuItem>
          {shipTypes.map((t) => (
            <MenuItem key={t} value={t}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    bgcolor: getShipTypeConfig(t).color,
                  }}
                />
                <span>{getShipTypeConfig(t).label}</span>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? undefined : 140 }}>
        <InputLabel>Sort by</InputLabel>
        <Select
          label="Sort by"
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value as SortField)}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="operator">Operator</MenuItem>
          <MenuItem value="speed">Speed</MenuItem>
          <MenuItem value="length">Length</MenuItem>
          <MenuItem value="lastUpdate">Last Update</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? undefined : 110 }}>
        <InputLabel>Order</InputLabel>
        <Select
          label="Order"
          value={sortDirection}
          onChange={(e) => onSortDirectionChange(e.target.value as SortDirection)}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </FormControl>
    </>
  );

  if (isMobile) {
    return (
      <Box
        sx={{
          bgcolor: "rgba(17,23,28,0.85)",
          borderRadius: 1.5,
          border: "1px solid rgba(255,255,255,0.08)",
          p: 2,
          mb: 2.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Search ships..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            sx={{ flex: 1, minWidth: 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title={mobileFiltersOpen ? "Hide filters" : "Show filters"}>
            <IconButton
              onClick={() => setMobileFiltersOpen((v) => !v)}
              aria-label="Toggle filters"
              sx={filterIconButtonSx(mobileFiltersOpen)}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={mobileFiltersOpen}>
          <Stack
            spacing={1.5}
            sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {filterSelects}
            {speedSlider}
          </Stack>
        </Collapse>

        <Typography
          sx={{
            mt: 1.5,
            display: "block",
            fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          SHOWING {resultCount} / {totalCount} CONTACTS
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "rgba(17,23,28,0.85)",
        borderRadius: 1.5,
        border: "1px solid rgba(255,255,255,0.08)",
        p: 2,
        mb: 2.5,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          placeholder="Search name, MMSI, operator, port..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />

        {filterSelects}

        <Tooltip title={showAdvanced ? "Hide speed filter" : "Show speed filter"}>
          <IconButton
            onClick={() => setShowAdvanced((v) => !v)}
            aria-label="Toggle speed filter"
            sx={filterIconButtonSx(showAdvanced)}
          >
            <FilterList />
          </IconButton>
        </Tooltip>
      </Stack>

      <Collapse in={showAdvanced}>
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {speedSlider}
        </Box>
      </Collapse>

      <Typography
        sx={{
          mt: 1.5,
          display: "block",
          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        SHOWING {resultCount} / {totalCount} CONTACTS
      </Typography>
    </Box>
  );
}
