'use client';

interface TopNavProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function TopNav({ title, subtitle, children }: TopNavProps) {
  return (
    <div className="status-bar">
      <span className="status-bar-label">{title}</span>
      {subtitle && <span className="status-bar-center">{subtitle}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {children}
      </div>
    </div>
  );
}
