'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  Building2, 
  FileText, 
  CreditCard, 
  Settings, 
  Wrench, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  User
} from 'lucide-react';

const roleNavLinks = {
  tenant: [
    { name: 'Dashboard', href: '/tenant', icon: Home },
    { name: 'Bills & Statements', href: '/tenant/bills', icon: FileText },
    { name: 'Maintenance', href: '/tenant/maintenance', icon: Wrench },
    { name: 'Announcements', href: '/tenant/announcements', icon: Bell },
    { name: 'Lease & Profile', href: '/tenant/profile', icon: User },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Buildings & Units', href: '/admin/properties', icon: Building2 },
    { name: 'Tenants & Leases', href: '/admin/tenants', icon: Users },
    { name: 'Billings', href: '/admin/billings', icon: FileText },
    { name: 'Billing Types', href: '/admin/billing-types', icon: Settings },
    { name: 'Collections', href: '/admin/collections', icon: CreditCard },
    { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
    { name: 'Announcements', href: '/admin/announcements', icon: Bell },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  super_admin: [
    { name: 'Dashboard', href: '/super-admin', icon: Home },
    { name: 'Admins (Customers)', href: '/super-admin/customers', icon: Users },
    { name: 'Subscription Tiers', href: '/super-admin/tiers', icon: FileText },
    { name: 'Global Settings', href: '/super-admin/settings', icon: Settings },
  ]
};

export default function DashboardShell({ 
  children, 
  role 
}: { 
  children: React.ReactNode, 
  role: 'tenant' | 'admin' | 'super_admin' 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  
  const links = roleNavLinks[role] || [];

  useEffect(() => {
    if (role === 'tenant') {
      fetch('/api/tenant/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.success && typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [role, pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 tracking-tight leading-tight block">Sylvia</span>
            <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">
              {role === 'tenant' ? 'Resident Portal' : role === 'admin' ? 'Property Manager' : 'Super Admin'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {role === 'tenant' && (
            <Link 
              href="/tenant/announcements"
              className="relative p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              title="Notices & Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </Link>
          )}

          {role === 'tenant' ? (
            <button 
              onClick={handleLogout} 
              className="p-2 text-gray-500 hover:text-red-600 rounded-xl hover:bg-gray-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:text-gray-900">
              <Menu size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Sidebar Overlay (admin / super_admin or tenant desktop) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen max-h-screen bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:sticky md:top-0 md:left-0 md:h-screen md:max-h-screen md:w-64 md:flex-shrink-0 md:self-start md:translate-x-0 md:z-30
      `}>
        <div className="flex-shrink-0 p-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight block leading-tight">Sylvia</span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">
                {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Property Manager' : 'Resident Portal'}
              </span>
            </div>
          </div>
          <button className="md:hidden text-gray-600 hover:text-gray-900" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0">
          {links.map((link) => {
            const isDashboardLink = link.name === 'Dashboard' || ['/admin', '/super-admin', '/tenant'].includes(link.href);
            const isActive = isDashboardLink 
              ? pathname === link.href 
              : pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{link.name}</span>
                </div>
                {role === 'tenant' && link.name === 'Announcements' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3.5 py-2.5 text-sm font-semibold text-gray-600 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 bg-gray-50 ${role === 'tenant' ? 'pb-24 md:pb-8' : ''}`}>
        {children}
      </main>

      {/* Mobile-First Bottom Navigation Bar for Tenants */}
      {role === 'tenant' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-1 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          {links.map((link) => {
            const isDashboardLink = link.name === 'Dashboard' || link.href === '/tenant';
            const isActive = isDashboardLink 
              ? pathname === link.href 
              : pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            
            // Short mobile label
            const label = (link.name === 'Bills & Statements' || link.name === 'Bills & Payments') ? 'Bills' : link.name === 'Announcements' ? 'Notices' : link.name === 'Lease & Profile' ? 'Profile' : link.name;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
                  isActive 
                    ? 'text-blue-600 font-bold' 
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-600' : 'text-gray-400'}`} />
                  {link.name === 'Announcements' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
