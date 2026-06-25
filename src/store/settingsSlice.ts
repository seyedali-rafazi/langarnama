import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MapStyleId } from "./mapStyles";

export interface SettingsState {
  mapStyleId: MapStyleId;
  shipSize: number;
  showShipLabels: boolean;
}

const initialState: SettingsState = {
  mapStyleId: "balad",
  shipSize: 20,
  showShipLabels: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setMapStyleId(state, action: PayloadAction<MapStyleId>) {
      state.mapStyleId = action.payload;
    },
    setShipSize(state, action: PayloadAction<number>) {
      state.shipSize = action.payload;
    },
    setShowShipLabels(state, action: PayloadAction<boolean>) {
      state.showShipLabels = action.payload;
    },
    toggleShowShipLabels(state) {
      state.showShipLabels = !state.showShipLabels;
    },
  },
});

export const {
  setMapStyleId,
  setShipSize,
  setShowShipLabels,
  toggleShowShipLabels,
} = settingsSlice.actions;

export default settingsSlice.reducer;
