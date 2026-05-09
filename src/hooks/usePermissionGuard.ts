import { useMemo } from 'react';
import { useAuthStore } from '@/store/useStore';
import type { User } from '@/types';

const permissionAliases: Record<string, string[]> = {
  'dashboard.view': ['access dashboard'],
  'access dashboard': ['dashboard.view'],

  'users.view': ['manage users', 'admin users'],
  'users.create': ['manage users', 'admin users'],
  'users.edit': ['manage users', 'admin users'],
  'users.delete': ['manage users', 'admin users'],
};

export function usePermissionGuard(permission: string): { isAuthorized: boolean; user: User | null } {
  const { user } = useAuthStore();

  const isAuthorized = useMemo(() => {
    if (!user) return false;

    // 1. Super Admin / Admin Bypass
    // Check if user has an admin role (case-insensitive)
    const adminRoles = ['admin', 'super_admin', 'super-admin', 'manager', 'administrator', 'root'];
    
    const hasAdminRole = user.roles?.some(r => {
      // Handle both object (Role) and string formats just in case
      const roleName = typeof r === 'string' ? r : r.name;
      return adminRoles.includes(roleName?.toLowerCase() || '');
    }) ?? false;

    // Also check for ID 1 as a fallback for the main super admin
    const isSuperAdminById = user.id === 1;

    if (hasAdminRole || isSuperAdminById) {
      return true;
    }

    // 2. Check for Specific Permission (مع دعم الأسماء القديمة)
    const aliases = permissionAliases[permission] || [];

    const matchesPerm = (permName: string | undefined): boolean => {
      if (!permName) return false;
      if (permName === permission) return true;
      return aliases.includes(permName);
    };

    // فحص الصلاحيات المباشرة
    const hasDirectPermission = user.permissions?.some(p =>
      matchesPerm(typeof p === 'string' ? p : p.name)
    ) ?? false;
    if (hasDirectPermission) return true;

    // فحص الصلاحيات المُرثاة من الأدوار
    return user.roles?.some(role =>
      role.permissions?.some(p =>
        matchesPerm(typeof p === 'string' ? p : p.name)
      )
    ) ?? false;

  }, [user, permission]);

  return { isAuthorized, user };
}
