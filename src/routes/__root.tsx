import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <div className="h-screen">
      <div className="fixed z-10 top-0 w-full bg-white border-b">
        <div className="p-2 flex gap-2">
          <Link to="/" className="[&.active]:font-bold">Stories</Link>
          <Link to="/create" className="[&.active]:font-bold">Create</Link>
        </div>
      </div>
      <Outlet />
    </div>
  ),
})