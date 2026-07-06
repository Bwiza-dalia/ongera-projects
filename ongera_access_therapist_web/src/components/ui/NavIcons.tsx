type IconProps = { size?: number };

export function IconDashboard({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function IconModules({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10v7H4V6.5z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5V11h-6V4z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 14h6v6H6.5A2.5 2.5 0 0 1 4 17.5V14z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M14 13h6v4.5A2.5 2.5 0 0 1 17.5 20H14v-7z" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function IconPatients({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M17 8.5h4M19 6.5v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconRequests({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.75" />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconReports({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V4h16v16H4z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 16v-4M12 16V8M16 16v-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconBell({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a5 5 0 0 0-5 5v3.5L5 14.5h14l-2-3V8a5 5 0 0 0-5-5z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M10 17.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function IconSettings({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconUsers({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M15 19c.3-2 1.8-3.5 4-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconTherapists({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9.5 12l1.8 1.8L15 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconCatalog({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5h14v14H5V5z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 5v14M5 9h14M5 15h14" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function IconLogout({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M14 12H3m0 0l3-3M3 12l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
