import React, { useState } from 'react';
import Header from './Header';
import SideNavigation from './SideNavigation';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onSearch }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="app-layout">
      <Header onSearch={onSearch} />
      <SideNavigation 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      <main className={`layout-content ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
