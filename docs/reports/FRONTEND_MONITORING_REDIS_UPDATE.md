# Frontend Monitoring Update

## Added

- New API endpoint constant:
  - `API_ENDPOINTS.PERFORMANCE.METRICS`
- New service method:
  - `performanceService.getMetrics()`
- Performance dashboard now displays:
  - Total API requests
  - Total 5xx errors
  - App average latency from backend metrics collector

## Notes

The dashboard uses `cache: 'no-store'` for live metrics to avoid stale monitoring values.
