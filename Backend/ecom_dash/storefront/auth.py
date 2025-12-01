# storefront/auth.py

import secrets
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions

from .models import CustomerAccount, CustomerSessionToken


def issue_customer_token(customer: CustomerAccount):
    """
    Creates and returns a new token for this customer.
    """
    token = secrets.token_hex(32)  # 64 character key
    CustomerSessionToken.objects.create(
        customer=customer,
        key=token,
        expires_at=None  # No expiry for now, you can implement one later
    )
    return CustomerSessionToken.objects.get(key=token)


class CustomerTokenAuthentication(BaseAuthentication):
    """
    Authenticate via:
    Authorization: Token <key>
    """

    keyword = "Token"

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return None  # Means no credentials provided

        try:
            keyword, key = auth_header.split()
        except ValueError:
            raise exceptions.AuthenticationFailed("Invalid authorization header format")

        if keyword != self.keyword:
            return None  # Let other authenticators try

        try:
            session = CustomerSessionToken.objects.get(key=key)
        except CustomerSessionToken.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid or expired token")

        if not session.is_valid():
            raise exceptions.AuthenticationFailed("Token expired")

        # Attach the customer to the request
        request.customer = session.customer
        return (session.customer, None)
