import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { nostrService } from '@/lib/nostr'

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: nostrService.isConnected,
    isConnecting: nostrService.isConnecting
  })
  const [isRetrying, setIsRetrying] = useState(false)

  // Handle manual connection retry
  const handleRetryConnection = async () => {
    if (connectionStatus.isConnecting) return
    
    setIsRetrying(true)
    try {
      await nostrService.connect()
    } catch (error) {
      console.error("Failed to connect manually:", error)
    } finally {
      setIsRetrying(false)
    }
  }

  // Update connection status periodically
  useEffect(() => {
    const checkConnectionStatus = () => {
      setConnectionStatus({
        isConnected: nostrService.isConnected,
        isConnecting: nostrService.isConnecting || isRetrying
      })
    }

    // Check status immediately
    checkConnectionStatus()
    
    // Then check every 1 second
    const interval = setInterval(checkConnectionStatus, 1000)
    
    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [isRetrying])

  // Get status color
  const getStatusColor = () => {
    if (connectionStatus.isConnected) return "text-green-500"
    if (connectionStatus.isConnecting) return "text-amber-500"
    return "text-red-500"
  }

  // Get status icon with retry button
  const StatusIndicator = () => (
    <div className="flex items-center gap-2">
      <span className={getStatusColor()}>
        {connectionStatus.isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
      </span>
      <span className="text-xs">
        {connectionStatus.isConnected 
          ? "Connected" 
          : connectionStatus.isConnecting 
            ? "Connecting..." 
            : "Disconnected"}
      </span>
      {!connectionStatus.isConnected && (
        <button 
          onClick={handleRetryConnection} 
          disabled={connectionStatus.isConnecting}
          className="ml-1 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
          title="Retry connection"
        >
          <RefreshCw size={14} className={connectionStatus.isConnecting ? "animate-spin" : ""} />
        </button>
      )}
    </div>
  )

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
            <div className="absolute top-full left-0 mt-1 bg-white border shadow-sm rounded-md w-44">
              <div className="p-2 flex flex-col">
                <Link to="/" className="py-2 px-3 rounded hover:bg-gray-100 [&.active]:font-bold">Stories</Link>
                <Link to="/create" className="py-2 px-3 rounded hover:bg-gray-100 [&.active]:font-bold">Create</Link>
                <div className="py-2 px-3 flex items-center gap-2">
                  <StatusIndicator />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block fixed z-50 top-2 left-2">
        <div className="bg-white border shadow-sm rounded-md p-2">
          <div className="flex gap-4 ml-2 items-center">
            <Link to="/" className="[&.active]:font-bold">Stories</Link>
            <Link to="/create" className="[&.active]:font-bold">Create</Link>
            <StatusIndicator />
          </div>
        </div>
      </div>
    </>
  )
} 