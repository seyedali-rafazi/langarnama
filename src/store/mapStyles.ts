export type MapStyleId = "dark" | "streets" | "light" | "satellite" | "balad";

export interface MapStyleOption {
  id: MapStyleId;
  label: string;
  url: string | Record<string, unknown>;
}

export const SATELLITE_STYLE: Record<string, unknown> = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        "&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  {
    id: "dark",
    label: "Dark",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  {
    id: "streets",
    label: "Streets",
    url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  },
  {
    id: "light",
    label: "Light",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  {
    id: "satellite",
    label: "Satellite",
    url: SATELLITE_STYLE,
  },
  {
    id: "balad",
    label: "Balad",
    url: "https://tiles.raah.ir/dynamic/new_style_preview.json",
  },
];

export function getMapStyleUrl(id: MapStyleId): string | Record<string, unknown> {
  return MAP_STYLE_OPTIONS.find((s) => s.id === id)?.url ?? MAP_STYLE_OPTIONS[0].url;
}
