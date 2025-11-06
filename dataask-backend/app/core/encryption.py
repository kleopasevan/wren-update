"""Encryption utilities for sensitive data like connection credentials."""
import base64
import json
from typing import Any

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config import settings


def _get_fernet() -> Fernet:
    """Get Fernet cipher instance."""
    # Derive a 32-byte key from the encryption key
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"dataask_salt",  # In production, use a random salt stored securely
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.ENCRYPTION_KEY.encode()))
    return Fernet(key)


def encrypt_credentials(credentials: dict[str, Any]) -> str:
    """Encrypt credentials dictionary to string."""
    fernet = _get_fernet()
    json_str = json.dumps(credentials)
    encrypted = fernet.encrypt(json_str.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_credentials(encrypted_credentials: str) -> dict[str, Any]:
    """Decrypt credentials string to dictionary."""
    fernet = _get_fernet()
    encrypted_bytes = base64.urlsafe_b64decode(encrypted_credentials.encode())
    decrypted = fernet.decrypt(encrypted_bytes)
    return json.loads(decrypted.decode())
