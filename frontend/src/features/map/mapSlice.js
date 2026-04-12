import { createSlice } from '@reduxjs/toolkit'
import { defaultMapCenter } from '../../constants/map.js'

const initialState = {
  center: defaultMapCenter,
  zoom: 13,
  selectedMarkerId: null,
}

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    mapViewportChanged(state, action) {
      state.center = action.payload.center ?? state.center
      state.zoom = action.payload.zoom ?? state.zoom
    },
    markerSelected(state, action) {
      state.selectedMarkerId = action.payload
    },
  },
})

export const { mapViewportChanged, markerSelected } = mapSlice.actions
export default mapSlice.reducer
