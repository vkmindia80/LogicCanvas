"""
Base Database Connector Class
Provides common functionality for all database connectors
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from cryptography.fernet import Fernet
import os


class DatabaseConnector(ABC):
    """Abstract base class for all database connectors"""
    
    def __init__(self, connection_id: str, config: Dict[str, Any]):
        self.connection_id = connection_id
        self.config = config
        self.connection = None
        self.pool = None
        self._encryption_key = self._get_encryption_key()
        
    def _get_encryption_key(self) -> bytes:
        """Get or create encryption key for credentials"""
        key = os.environ.get('DB_ENCRYPTION_KEY')
        if not key:
            # Generate a new key (in production, this should be stored securely)
            key = Fernet.generate_key().decode()
            os.environ['DB_ENCRYPTION_KEY'] = key
        return key.encode() if isinstance(key, str) else key
    
    def encrypt_credential(self, value: str) -> str:
        """Encrypt sensitive credential"""
        if not value:
            return value
        f = Fernet(self._encryption_key)
        return f.encrypt(value.encode()).decode()
    
    def decrypt_credential(self, encrypted_value: str) -> str:
        """Decrypt sensitive credential"""
        if not encrypted_value:
            return encrypted_value
        try:
            f = Fernet(self._encryption_key)
            return f.decrypt(encrypted_value.encode()).decode()
        except Exception:
            # If decryption fails, assume it's not encrypted
            return encrypted_value
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish database connection"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Close database connection"""
        pass
    
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test database connection and return status"""
        pass
    
    @abstractmethod
    async def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a query and return results"""
        pass
    
    @abstractmethod
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data into table/collection"""
        pass
    
    @abstractmethod
    async def update(self, table: str, data: Dict[str, Any], condition: Dict[str, Any]) -> Dict[str, Any]:
        """Update data in table/collection"""
        pass
    
    @abstractmethod
    async def delete(self, table: str, condition: Dict[str, Any]) -> Dict[str, Any]:
        """Delete data from table/collection"""
        pass
    
    def get_connection_info(self) -> Dict[str, Any]:
        """Get sanitized connection information (without sensitive data)"""
        safe_config = self.config.copy()
        # Remove sensitive fields
        sensitive_fields = ['password', 'secret_key', 'api_key', 'private_key']
        for field in sensitive_fields:
            if field in safe_config:
                safe_config[field] = '***REDACTED***'
        
        return {
            'connection_id': self.connection_id,
            'config': safe_config,
            'connected': self.connection is not None,
            'type': self.__class__.__name__
        }
    
    def _log_operation(self, operation: str, status: str, details: Optional[Dict[str, Any]] = None):
        """Log database operation for audit trail"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'connection_id': self.connection_id,
            'operation': operation,
            'status': status,
            'details': details or {}
        }
        # In a real implementation, this would write to an audit log
        print(f"[DB Operation] {json.dumps(log_entry)}")
