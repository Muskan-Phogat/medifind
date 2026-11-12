import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db import query_one

security = HTTPBearer(auto_error=False)

def hash_pin(pin: str, salt: Optional[str] = None) -> str:
    """Generate salted PBKDF2-SHA256 hash for 4-digit PIN."""
    if not salt:
        salt = secrets.token_hex(8)
    h = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"{salt}:{h}"


def verify_pin(pin: str, stored_hash: str, fallback_pin: Optional[str] = None) -> bool:
    """Verifies pin against stored hash, or fallback_pin if stored_hash is empty."""
    if stored_hash and ":" in stored_hash:
        try:
            salt, h = stored_hash.split(":", 1)
            expected = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
            if h == expected:
                return True
        except Exception:
            pass
    if fallback_pin and pin == fallback_pin:
        return True
    return False


def create_access_token(pharmacy_id: int, pharmacy_name: str) -> str:
    """Creates signed JWT token with expiration."""
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    to_encode = {
        "sub": str(pharmacy_id),
        "name": pharmacy_name,
        "exp": expire,
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Authentication token has expired."},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Could not validate authentication credentials."},
        )


def get_current_pharmacy(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    """FastAPI dependency for protecting authenticated pharmacy endpoints."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Bearer authentication required."},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    pharmacy_id = payload.get("sub")
    if not pharmacy_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Invalid token subject."},
        )
    pharmacy = query_one("SELECT * FROM pharmacies WHERE id = ?", (pharmacy_id,))
    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PHARMACY_NOT_FOUND", "message": "Pharmacy account not found."},
        )
    return pharmacy
