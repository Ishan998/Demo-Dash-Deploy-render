from rest_framework.permissions import BasePermission

class IsCustomerAuthenticated(BasePermission):
    """
    Requires storefront auth (CustomerTokenAuthentication).
    """
    def has_permission(self, request, view):
        return hasattr(request, "customer") and request.customer is not None
