import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Navigation (Hamburger) */}
      <div className="md:hidden fixed z-50 top-2 left-2">
        <div className="bg-white border shadow-sm rounded-md">
          <button 
            className="p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={24} />
          </button>
          
          {/* Mobile menu dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border shadow-sm rounded-md w-40">
              <div className="p-2 flex flex-col">
                <Link to="/" className="py-2 px-3 rounded hover:bg-gray-100 [&.active]:font-bold">Stories</Link>
                <Link to="/create" className="py-2 px-3 rounded hover:bg-gray-100 [&.active]:font-bold">Create</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block fixed z-50 top-2 left-2">
        <div className="bg-white border shadow-sm rounded-md p-2">
          <div className="flex gap-4 ml-2">
            <Link to="/" className="[&.active]:font-bold">Stories</Link>
            <Link to="/create" className="[&.active]:font-bold">Create</Link>
          </div>
        </div>
      </div>
    </>
  )
} 