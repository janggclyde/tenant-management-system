'use client';

import { useState } from 'react';
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
  LogOut 
} from 'lucide-react';

const roleNavLinks = {
  tenant: [
    { name: 'Dashboard', href: '/tenant', icon: Home },
    { name: 'Bills & Payments', href: '/tenant/bills', icon: CreditCard },
    { name: 'Maintenance', href: '/tenant/maintenance', icon: Wrench },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Buildings & Units', href: '/admin/properties', icon: Building2 },
    { name: 'Tenants & Leases', href: '/admin/tenants', icon: Users },
    { name: 'Billings', href: '/admin/billings', icon: FileText },
    { name: 'Billing Types', href: '/admin/billing-types', icon: Settings },
    { name: 'Collections', href: '/admin/collections', icon: CreditCard },
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
  const pathname = usePathname();
  const router = useRouter();
  
  const links = roleNavLinks[role] || [];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <span className="text-xl font-bold text-gray-900">App</span>
        <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            {role === 'super_admin' ? 'SuperAdmin' : role === 'admin' ? 'PropertyManager' : 'TenantPortal'}
          </span>
          <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {link.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
