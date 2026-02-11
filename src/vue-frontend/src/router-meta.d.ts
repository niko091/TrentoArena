import "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresStats?: boolean;
    guest?: boolean;
    hideNavbar?: boolean;
  }
}
