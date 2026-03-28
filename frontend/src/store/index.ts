// ─── Global Zustand Store ────────────────────────────────────────────────────
// Using Zustand (chosen over Redux Toolkit because):
//   • Zero boilerplate for this use-case
//   • Slice pattern gives same modularity without mandatory reducers
//   • Ideal for real-time diffs: direct mutation via immer or set()
//   • Native to React Strict Mode; no Provider wrapping needed
// Store is sliced into: samples | stats | batches | alerts | ui
// ─────────────────────────────────────────────────────────────────────────────

export { useSamplesStore } from './slices/samplesSlice';
export { useStatsStore }   from './slices/statsSlice';
export { useBatchesStore } from './slices/batchesSlice';
export { useAlertsStore }  from './slices/alertsSlice';
export { useUIStore }      from './slices/uiSlice';
