'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, TrendingUp, Layers } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'DASHBOARD', href: '/', icon: LayoutDashboard },
    { name: 'REPOS', href: '/repos', icon: List },
    { name: 'TRENDS', href: '/clusters', icon: TrendingUp },
    { name: 'GRADUATED', href: '/graduated', icon: Layers },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[88px] bg-white border-r border-[#E2E8F0] z-[60] flex flex-col items-center py-8">
      {/* Fixed Logo */}
      <div className="mb-12 flex flex-col items-center justify-center w-full px-4 group">
        <div className="w-14 h-14 flex items-center justify-center mb-2 transition-transform active:scale-95 cursor-pointer">
          <Image 
            src="/logo.png" 
            alt="Repo Trend Radar" 
            width={56} 
            height={56} 
            className="w-full h-full object-contain animate-[spin_20s_linear_infinite]"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 w-full space-y-4 px-4 flex flex-col items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {/* Tooltip */}
              <div className="absolute left-[100%] ml-4 hidden group-hover:block bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
