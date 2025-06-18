// src/utils/permissions.jsx
export const rolePermissions = {
    Student: ['view_activities', 'submit_feedback'],
    Faculty: ['create_activity', 'view_feedback', 'manage_activities'],
    Admin: ['full_access']
  };
  
  export const usePermissions = () => {
    const checkPermission = (user, requiredPermissions) => {
      if (!user?.role) return false;
      
      // Admins have all permissions
      if (user.role === 'Admin') return true;
      
      return requiredPermissions.every(permission => 
        rolePermissions[user.role]?.includes(permission)
      );
    };
  
    return { checkPermission };
  };
  
  // Usage in components:
  // const { checkPermission } = usePermissions();
  // if (checkPermission(user, ['create_activity'])) { ... }