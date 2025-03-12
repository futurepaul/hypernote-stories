import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Nav } from '../components/Nav'

export const Route = createRootRoute({
  component: () => (
    <div className="h-screen">
      <Nav />
      <Outlet />
    </div>
  ),
})