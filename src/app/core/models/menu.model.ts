export interface SidebarLink {
  type?: 'link';
  icon: string;
  label: string;
  route: string;
}

export interface SidebarSubGroup {
  type: 'subgroup';
  group: string;
  dataGroup: string;
  icon: string;
  children: SidebarLink[];
}

export interface SidebarGroup {
  type: 'group';
  group: string;
  dataGroup: string;
  icon: string;
  children: (SidebarLink | SidebarSubGroup)[];
}

export type MenuEntry = SidebarLink | SidebarGroup;
