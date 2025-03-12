import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <div className="h-screen">
      <div className="fixed z-50 top-0 h-10 bg-white border-b shadow-sm rounded-sm mt-2 ml-2">
        <div className="p-2 flex gap-2">
          <Link to="/" className="[&.active]:font-bold">Stories</Link>
          <Link to="/create" className="[&.active]:font-bold">Create</Link>
          <Link to="/grid-tester" className="[&.active]:font-bold">Grid Tester</Link>
        </div>
      </div>
      <Outlet />
    </div>
  ),
})