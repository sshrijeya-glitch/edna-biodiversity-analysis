import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

/**
 * Shell for every signed-in-style page: fixed dark sidebar + light content column.
 * The landing page deliberately sits outside this layout.
 */
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-mist">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[264px]">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto animate-fadeUp">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
