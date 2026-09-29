import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Cpu, 
  Database, 
  Bot, 
  Terminal, 
  Code2, 
  HardDrive, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function Sidebar({ isCollapsed, toggleSidebar, labStats = [] }) {
  const labItems = [
    { name: 'SWL – 202', path: '/lab/swl', code: 'SWL', icon: Terminal, room: '202' },
    { name: 'AR/VR – 234', path: '/lab/ar-vr', code: 'AR/VR', icon: Cpu, room: '234' },
    { name: 'DSL – 235', path: '/lab/dsl', code: 'DSL', icon: Database, room: '235' },
    { name: 'AIL – 236', path: '/lab/ail', code: 'AIL', icon: Bot, room: '236' },
    { name: 'OSL – 238', path: '/lab/osl', code: 'OSL', icon: HardDrive, room: '238' },
    { name: 'PL – 239', path: '/lab/pl', code: 'PL', icon: Code2, room: '239' },
  ];

  const mainNav = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  ];

  const secondaryNav = [
    { name: 'Equipment', path: '/equipment', icon: Monitor },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 bottom-0 z-30 bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm tracking-wide leading-none">AI & DS DEPT</span>
              <span className="text-[11px] text-slate-400 font-medium mt-1">Lab Audit Portal</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto p-2 rounded-xl bg-indigo-600 text-white">
            <Building2 className="w-5 h-5" />
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Main Section */}
        <div>
          {!isCollapsed && <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Main</p>}
          <div className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Laboratories Section */}
        <div>
          {!isCollapsed && <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Laboratories</p>}
          <div className="space-y-1">
            {labItems.map((item) => {
              const Icon = item.icon;
              const stat = labStats.find(s => s.id === item.path.replace('/lab/', ''));
              const faulty = stat ? stat.faulty : 0;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center' : 'justify-between'}`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className="flex items-center min-w-0">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                  </div>

                  {!isCollapsed && faulty > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {faulty}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* System & Audit Section */}
        <div>
          {!isCollapsed && <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Audit & Assets</p>}
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Year 2026-27</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Excel Data Source Active</p>
        </div>
      )}
    </aside>
  );
}
