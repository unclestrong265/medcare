import uuid
from dataclasses import dataclass
from typing import Optional, Tuple

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


@dataclass
class SupabaseUser:
    id: uuid.UUID
    email: Optional[str] = None
    is_authenticated: bool = True


class SupabaseJWTAuthentication(BaseAuthentication):
    def authenticate(self, request) -> Optional[Tuple[SupabaseUser, dict]]:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        if not settings.SUPABASE_JWT_SECRET:
            raise AuthenticationFailed("Supabase JWT secret is not configured.")

        options = {"verify_aud": bool(settings.SUPABASE_JWT_AUDIENCE)}
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=settings.SUPABASE_JWT_AUDIENCE or None,
                options=options,
            )
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed("Invalid access token.") from exc

        subject = payload.get("sub")
        if not subject:
            raise AuthenticationFailed("Token missing subject.")

        try:
            user_id = uuid.UUID(subject)
        except ValueError as exc:
            raise AuthenticationFailed("Invalid user id in token.") from exc

        user = SupabaseUser(id=user_id, email=payload.get("email"))
        return user, payload
