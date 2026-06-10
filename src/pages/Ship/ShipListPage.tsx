import { PushPin, SearchOff } from "@mui/icons-material";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { memo, useMemo, useState } from "react";
import shipData from "../Home/components/ShipLayer/data/iran_ships.json";
import type { Ship } from "../Home/components/ShipLayer/types/Ship";
import ShipCard from "./components/ShipCard";
import ShipFiltersBar from "./components/ShipFiltersBar";
import { useWatchlist } from "./context/WatchlistContext";
import {
  DEFAULT_FILTERS,
  filterShips,
  getUniqueOperators,
  getUniqueTypes,
  sortShips,
  type ShipFilters,
  type SortDirection,
  type SortField,
} from "./utils/shipFilters";

const MONO = '"JetBrains Mono", "Cascadia Code", "Roboto Mono", monospace';

const allShips = shipData as Ship[];
const operators = getUniqueOperators(allShips);
const shipTypes = getUniqueTypes(allShips);

const underwayCount = allShips.filter((s) => s.speed_kts >= 0.5).length;
const avgSpeed =
  Math.round(
    (allShips.reduce((sum, s) => sum + s.speed_kts, 0) / allShips.length) * 10
  ) / 10;

interface StatItemProps {
  label: string;
  value: string | number;
  accent?: string;
  active?: boolean;
  onClick?: () => void;
}

function StatItem({ label, value, accent, active, onClick }: StatItemProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: { xs: 1.5, md: 2.5 },
        py: 1.25,
        minWidth: 0,
        cursor: onClick ? "pointer" : "default",
        borderRadius: 1,
        border: "1px solid",
        borderColor: active ? "rgba(34,211,238,0.5)" : "transparent",
        bgcolor: active ? "rgba(34,211,238,0.08)" : "transparent",
        transition: "all 0.2s ease",
        "&:hover": onClick
          ? { bgcolor: active ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)" }
          : undefined,
      }}
    >
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: "0.58rem",
          letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.42)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: { xs: "1.1rem", md: "1.35rem" },
          fontWeight: 700,
          lineHeight: 1.3,
          color: accent ?? "rgba(255,255,255,0.92)",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ShipListPage() {
  const [filters, setFilters] = useState<ShipFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [trackedOnly, setTrackedOnly] = useState(false);
  const { trackedIds, trackedCount } = useWatchlist();

  const displayedShips = useMemo(() => {
    let filtered = filterShips(allShips, filters);
    if (trackedOnly) {
      filtered = filtered.filter((s) => trackedIds.includes(s.id));
    }
    return sortShips(filtered, sortField, sortDirection);
  }, [filters, sortField, sortDirection, trackedOnly, trackedIds]);

  const activeCount = displayedShips.length;

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        bgcolor: "#0b1014",
        backgroundImage:
          "linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 3.5 }}>
        {/* console header */}
        <Box
          sx={{
            mb: 2.5,
            pb: 2,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 0.75 }}
          >
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                letterSpacing: "0.22em",
                color: "#22d3ee",
              }}
            >
              {"// FLEET REGISTRY"}
            </Typography>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.9)",
                animation: "registry-blink 2s ease-in-out infinite",
                "@keyframes registry-blink": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.3 },
                },
              }}
            />
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              LIVE
            </Typography>
          </Stack>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.94)",
            }}
          >
            Vessel Registry
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.25 }}>
            All vessels currently reporting across monitored waters
          </Typography>
        </Box>

        {/* stat strip */}
        <Stack
          direction="row"
          alignItems="stretch"
          sx={{
            mb: 2.5,
            borderRadius: 1.5,
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(17,23,28,0.85)",
            overflowX: "auto",
            "& > *:not(:last-child)": {
              borderRight: "1px solid rgba(255,255,255,0.07)",
            },
          }}
        >
          <StatItem label="VESSELS" value={allShips.length} />
          <StatItem label="UNDERWAY" value={underwayCount} accent="#22c55e" />
          <StatItem label="AVG SPD" value={`${avgSpeed}kn`} />
          <StatItem label="OPERATORS" value={operators.length} />
          <StatItem label="IN VIEW" value={activeCount} accent="#22d3ee" />
          <StatItem
            label="TRACKED ◢"
            value={trackedCount}
            accent={trackedOnly ? "#22d3ee" : undefined}
            active={trackedOnly}
            onClick={() => setTrackedOnly((v) => !v)}
          />
        </Stack>

        <ShipFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={setSortField}
          onSortDirectionChange={setSortDirection}
          operators={operators}
          shipTypes={shipTypes}
          resultCount={activeCount}
          totalCount={allShips.length}
        />

        {displayedShips.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              borderRadius: 1.5,
              border: "1px dashed rgba(255,255,255,0.14)",
              bgcolor: "rgba(17,23,28,0.5)",
            }}
          >
            {trackedOnly && trackedCount === 0 ? (
              <>
                <PushPin sx={{ fontSize: 42, color: "rgba(34,211,238,0.4)", mb: 1.5 }} />
                <Typography
                  sx={{ fontFamily: MONO, letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}
                >
                  NO TRACKED VESSELS
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
                  Pin a vessel from its card to build your tracked fleet
                </Typography>
              </>
            ) : (
              <>
                <SearchOff sx={{ fontSize: 42, color: "rgba(255,255,255,0.3)", mb: 1.5 }} />
                <Typography
                  sx={{ fontFamily: MONO, letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}
                >
                  NO CONTACTS MATCH QUERY
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
                  Try adjusting search or filter criteria
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {displayedShips.map((ship) => (
              <Grid key={ship.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ShipCard ship={ship} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* console footer */}
        <Typography
          sx={{
            mt: 3,
            textAlign: "center",
            fontFamily: MONO,
            fontSize: "0.58rem",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          LANGARNAMA REGISTRY · END OF MANIFEST
        </Typography>
      </Box>
    </Box>
  );
}

export default memo(ShipListPage);
