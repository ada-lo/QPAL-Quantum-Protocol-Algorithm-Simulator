from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Annotated, Any
from urllib.parse import urlparse

import jwt
from fastapi import Header, HTTPException, status
from jwt import InvalidTokenError, PyJWKClient
from jwt.exceptions import PyJWKClientError


@dataclass(frozen=True)
class NeonAuthSettings:
    auth_url: str
    issuer: str
    jwks_url: str


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    claims: dict[str, Any]


@lru_cache
def get_neon_auth_settings() -> NeonAuthSettings:
    raw_auth_url = (os.getenv("NEON_AUTH_URL") or os.getenv("VITE_NEON_AUTH_URL") or "").strip().rstrip("/")
    if not raw_auth_url:
        raise RuntimeError("Missing NEON_AUTH_URL (or VITE_NEON_AUTH_URL) for workspace authentication.")

    parsed = urlparse(raw_auth_url)
    if not parsed.scheme or not parsed.netloc:
        raise RuntimeError("NEON_AUTH_URL is not a valid absolute URL.")

    issuer = f"{parsed.scheme}://{parsed.netloc}"
    return NeonAuthSettings(
        auth_url=raw_auth_url,
        issuer=issuer,
        jwks_url=f"{raw_auth_url}/.well-known/jwks.json",
    )


@lru_cache
def get_neon_jwks_client() -> PyJWKClient:
    settings = get_neon_auth_settings()
    return PyJWKClient(settings.jwks_url)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_authenticated_user(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise _unauthorized("Missing Neon bearer token.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise _unauthorized("Missing Neon bearer token.")

    try:
        settings = get_neon_auth_settings()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        signing_key = get_neon_jwks_client().get_signing_key_from_jwt(token)
    except PyJWKClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach Neon Auth to validate the current session.",
        ) from exc

    try:
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.issuer,
            options={"verify_aud": False},
        )
    except InvalidTokenError as exc:
        raise _unauthorized("Invalid or expired Neon session.") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise _unauthorized("Neon session is missing a subject claim.")

    return AuthenticatedUser(user_id=user_id, claims=payload)
