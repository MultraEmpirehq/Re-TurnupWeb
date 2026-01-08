import { ROUTE_TYPE, RouteProps } from "./types";
import { ROUTES } from "./variables";

export const getRoutesByType = (type: ROUTE_TYPE) => {
  return Object.values(ROUTES).filter((route: RouteProps) =>
    route.shouldShowIn.includes(type)
  );
};
