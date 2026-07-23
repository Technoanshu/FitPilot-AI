/**
 * Shared API service boundary.
 *
 * Domain queries and mutations are generated from the OpenAPI contract and
 * imported from @workspace/api-client-react by feature hooks and pages.
 * This module is intentionally small so future auth, telemetry, and request
 * policy concerns have one stable home without duplicating generated clients.
 */
export const apiBasePath = "/api";