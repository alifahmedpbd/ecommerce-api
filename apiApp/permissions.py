
from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Only Super Admin can access.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsStaffOrSuperAdmin(BasePermission):
    """
    Staff and Super Admin can access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return (
            request.user.is_superuser
            or request.user.groups.filter(name="Staff").exists()
        )


class HasModelPermission(BasePermission):
    """
    Checks Django model permissions.
    Super Admin automatically has full access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        required_permission = getattr(
            view, "required_permission", None
        )

        if not required_permission:
            return False

        return request.user.has_perm(required_permission)
