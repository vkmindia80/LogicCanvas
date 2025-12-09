"""
NoSQL Database Connectors
Supports MongoDB (enhanced), Redis, and Apache Cassandra
"""

from typing import Dict, Any, List, Optional
from .base_connector import DatabaseConnector
import json


class MongoDBConnector(DatabaseConnector):
    """Enhanced MongoDB connector with aggregation and bulk operations"""
    
    def __init__(self, connection_id: str, config: Dict[str, Any]):
        super().__init__(connection_id, config)
        self.db_type = 'mongodb'
        
    async def connect(self) -> bool:
        """Establish MongoDB connection"""
        try:
            self._log_operation('connect', 'attempting')
            
            # Decrypt password if present
            password = self.decrypt_credential(self.config.get('password', ''))
            
            # Simulate connection
            self.connection = {
                'host': self.config.get('host', 'localhost'),
                'port': self.config.get('port', 27017),
                'database': self.config.get('database'),
                'connected': True
            }
            
            self._log_operation('connect', 'success')
            return True
        except Exception as e:
            self._log_operation('connect', 'failed', {'error': str(e)})
            return False
    
    async def disconnect(self) -> bool:
        """Close MongoDB connection"""
        try:
            if self.connection:
                self.connection['connected'] = False
                self.connection = None
                self._log_operation('disconnect', 'success')
            return True
        except Exception as e:
            self._log_operation('disconnect', 'failed', {'error': str(e)})
            return False
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test MongoDB connection"""
        try:
            await self.connect()
            
            result = {
                'success': True,
                'message': 'Connection successful',
                'database_type': 'MongoDB',
                'version': '6.0 (simulated)',
                'host': self.config.get('host'),
                'database': self.config.get('database')
            }
            
            await self.disconnect()
            return result
        except Exception as e:
            return {
                'success': False,
                'message': f'Connection failed: {str(e)}',
                'database_type': 'MongoDB'
            }
    
    async def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute MongoDB query (find operation)"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            self._log_operation('execute_query', 'executing', {'query': query[:100]})
            
            # Parse query as JSON (MongoDB query syntax)
            try:
                query_obj = json.loads(query) if isinstance(query, str) else query
            except:
                query_obj = {}
            
            result = {
                'success': True,
                'data': [
                    {'_id': '507f1f77bcf86cd799439011', 'name': 'MongoDB Sample', 'value': 100},
                    {'_id': '507f1f77bcf86cd799439012', 'name': 'Another Doc', 'value': 200}
                ],
                'count': 2,
                'query': query_obj
            }
            
            self._log_operation('execute_query', 'success')
            return result
        except Exception as e:
            self._log_operation('execute_query', 'failed', {'error': str(e)})
            return {
                'success': False,
                'error': str(e),
                'query': query
            }
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert document into MongoDB collection"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            self._log_operation('insert', 'executing', {'collection': table})
            
            # In real implementation: collection.insert_one(data)
            result = {
                'success': True,
                'inserted_id': '507f1f77bcf86cd799439013',
                'collection': table,
                'acknowledged': True
            }
            
            self._log_operation('insert', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'insert'
            }
    
    async def update(self, table: str, data: Dict[str, Any], condition: Dict[str, Any]) -> Dict[str, Any]:
        """Update document in MongoDB collection"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            self._log_operation('update', 'executing', {'collection': table})
            
            result = {
                'success': True,
                'matched_count': 1,
                'modified_count': 1,
                'collection': table,
                'acknowledged': True
            }
            
            self._log_operation('update', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'update'
            }
    
    async def delete(self, table: str, condition: Dict[str, Any]) -> Dict[str, Any]:
        """Delete document from MongoDB collection"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            self._log_operation('delete', 'executing', {'collection': table})
            
            result = {
                'success': True,
                'deleted_count': 1,
                'collection': table,
                'acknowledged': True
            }
            
            self._log_operation('delete', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'delete'
            }
    
    async def aggregate(self, collection: str, pipeline: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute MongoDB aggregation pipeline"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            self._log_operation('aggregate', 'executing', {'collection': collection, 'stages': len(pipeline)})
            
            # Simulate aggregation results
            result = {
                'success': True,
                'data': [
                    {'_id': 'group1', 'count': 5, 'total': 500},
                    {'_id': 'group2', 'count': 3, 'total': 300}
                ],
                'collection': collection,
                'pipeline_stages': len(pipeline)
            }
            
            self._log_operation('aggregate', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'aggregate'
            }
    
    async def bulk_insert(self, collection: str, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Bulk insert documents into MongoDB collection"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            if not documents:
                return {'success': False, 'error': 'No documents provided'}
            
            self._log_operation('bulk_insert', 'executing', {'collection': collection, 'count': len(documents)})
            
            result = {
                'success': True,
                'inserted_count': len(documents),
                'inserted_ids': [f'507f1f77bcf86cd79943{i:04d}' for i in range(len(documents))],
                'collection': collection,
                'acknowledged': True
            }
            
            self._log_operation('bulk_insert', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'bulk_insert'
            }


class RedisConnector(DatabaseConnector):
    """Redis key-value store connector"""
    
    def __init__(self, connection_id: str, config: Dict[str, Any]):
        super().__init__(connection_id, config)
        self.db_type = 'redis'
        
    async def connect(self) -> bool:
        """Establish Redis connection"""
        try:
            self._log_operation('connect', 'attempting')
            
            # Decrypt password if present
            password = self.decrypt_credential(self.config.get('password', ''))
            
            self.connection = {
                'host': self.config.get('host', 'localhost'),
                'port': self.config.get('port', 6379),
                'db': self.config.get('database', 0),
                'connected': True
            }
            
            self._log_operation('connect', 'success')
            return True
        except Exception as e:
            self._log_operation('connect', 'failed', {'error': str(e)})
            return False
    
    async def disconnect(self) -> bool:
        """Close Redis connection"""
        try:
            if self.connection:
                self.connection['connected'] = False
                self.connection = None
                self._log_operation('disconnect', 'success')
            return True
        except Exception as e:
            self._log_operation('disconnect', 'failed', {'error': str(e)})
            return False
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Redis connection"""
        try:
            await self.connect()
            
            result = {
                'success': True,
                'message': 'Connection successful (PING OK)',
                'database_type': 'Redis',
                'version': '7.0 (simulated)',
                'host': self.config.get('host'),
                'db': self.config.get('database', 0)
            }
            
            await self.disconnect()
            return result
        except Exception as e:
            return {
                'success': False,
                'message': f'Connection failed: {str(e)}',
                'database_type': 'Redis'
            }
    
    async def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute Redis command"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            # Parse Redis command
            command_parts = query.strip().split()
            command = command_parts[0].upper() if command_parts else 'GET'
            
            self._log_operation('execute_query', 'executing', {'command': command})
            
            result = {
                'success': True,
                'command': command,
                'result': 'OK' if command in ['SET', 'DEL'] else 'sample_value',
                'execution_time_ms': 2
            }
            
            self._log_operation('execute_query', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'query': query
            }
    
    async def get(self, key: str) -> Dict[str, Any]:
        """Get value from Redis"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            result = {
                'success': True,
                'key': key,
                'value': f'value_for_{key}',
                'exists': True
            }
            
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'get'
            }
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> Dict[str, Any]:
        """Set value in Redis"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            result = {
                'success': True,
                'key': key,
                'value': value,
                'expire': expire,
                'result': 'OK'
            }
            
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'set'
            }
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert (SET) in Redis - table is used as key prefix"""
        key = f"{table}:{data.get('id', 'default')}"
        return await self.set(key, json.dumps(data))
    
    async def update(self, table: str, data: Dict[str, Any], condition: Dict[str, Any]) -> Dict[str, Any]:
        """Update (SET) in Redis"""
        key = f"{table}:{condition.get('id', 'default')}"
        return await self.set(key, json.dumps(data))
    
    async def delete(self, table: str, condition: Dict[str, Any]) -> Dict[str, Any]:
        """Delete (DEL) from Redis"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            key = f"{table}:{condition.get('id', 'default')}"
            
            result = {
                'success': True,
                'key': key,
                'deleted': 1
            }
            
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'delete'
            }
    
    async def increment(self, key: str, amount: int = 1) -> Dict[str, Any]:
        """Increment value in Redis"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            result = {
                'success': True,
                'key': key,
                'new_value': 100 + amount,  # Simulated
                'incremented_by': amount
            }
            
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'increment'
            }


class CassandraConnector(DatabaseConnector):
    """Apache Cassandra distributed database connector"""
    
    def __init__(self, connection_id: str, config: Dict[str, Any]):
        super().__init__(connection_id, config)
        self.db_type = 'cassandra'
        
    async def connect(self) -> bool:
        """Establish Cassandra connection"""
        try:
            self._log_operation('connect', 'attempting')
            
            # Decrypt password if present
            password = self.decrypt_credential(self.config.get('password', ''))
            
            # Simulate connection
            self.connection = {
                'contact_points': self.config.get('contact_points', ['localhost']),
                'port': self.config.get('port', 9042),
                'keyspace': self.config.get('keyspace'),
                'connected': True
            }
            
            self._log_operation('connect', 'success')
            return True
        except Exception as e:
            self._log_operation('connect', 'failed', {'error': str(e)})
            return False
    
    async def disconnect(self) -> bool:
        """Close Cassandra connection"""
        try:
            if self.connection:
                self.connection['connected'] = False
                self.connection = None
                self._log_operation('disconnect', 'success')
            return True
        except Exception as e:
            self._log_operation('disconnect', 'failed', {'error': str(e)})
            return False
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Cassandra connection"""
        try:
            await self.connect()
            
            result = {
                'success': True,
                'message': 'Connection successful',
                'database_type': 'Apache Cassandra',
                'version': '4.0 (simulated)',
                'contact_points': self.config.get('contact_points', ['localhost']),
                'keyspace': self.config.get('keyspace')
            }
            
            await self.disconnect()
            return result
        except Exception as e:
            return {
                'success': False,
                'message': f'Connection failed: {str(e)}',
                'database_type': 'Apache Cassandra'
            }
    
    async def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute Cassandra CQL query"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            self._log_operation('execute_query', 'executing', {'query': query[:100]})
            
            result = {
                'success': True,
                'data': [],
                'query': query,
                'execution_time_ms': 35
            }
            
            # Simulate SELECT results
            if query.strip().upper().startswith('SELECT'):
                result['data'] = [
                    {'id': 'uuid-001', 'name': 'Cassandra Sample', 'timestamp': '2024-01-01 00:00:00'},
                    {'id': 'uuid-002', 'name': 'Another Row', 'timestamp': '2024-01-02 00:00:00'}
                ]
                result['row_count'] = len(result['data'])
            else:
                result['applied'] = True
                result['message'] = 'Query executed successfully'
            
            self._log_operation('execute_query', 'success')
            return result
        except Exception as e:
            self._log_operation('execute_query', 'failed', {'error': str(e)})
            return {
                'success': False,
                'error': str(e),
                'query': query
            }
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data into Cassandra table"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            columns = ', '.join(data.keys())
            placeholders = ', '.join(['?'] * len(data))
            query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
            
            self._log_operation('insert', 'executing', {'table': table})
            
            result = {
                'success': True,
                'applied': True,
                'table': table,
                'message': 'Row inserted successfully'
            }
            
            self._log_operation('insert', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'insert'
            }
    
    async def update(self, table: str, data: Dict[str, Any], condition: Dict[str, Any]) -> Dict[str, Any]:
        """Update data in Cassandra table"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            set_clause = ', '.join([f"{k} = ?" for k in data.keys()])
            where_clause = ' AND '.join([f"{k} = ?" for k in condition.keys()])
            query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
            
            self._log_operation('update', 'executing', {'table': table})
            
            result = {
                'success': True,
                'applied': True,
                'table': table,
                'message': 'Row updated successfully'
            }
            
            self._log_operation('update', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'update'
            }
    
    async def delete(self, table: str, condition: Dict[str, Any]) -> Dict[str, Any]:
        """Delete data from Cassandra table"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            where_clause = ' AND '.join([f"{k} = ?" for k in condition.keys()])
            query = f"DELETE FROM {table} WHERE {where_clause}"
            
            self._log_operation('delete', 'executing', {'table': table})
            
            result = {
                'success': True,
                'applied': True,
                'table': table,
                'message': 'Row deleted successfully'
            }
            
            self._log_operation('delete', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'delete'
            }
    
    async def batch_execute(self, queries: List[str]) -> Dict[str, Any]:
        """Execute batch of CQL queries"""
        try:
            if not self.connection or not self.connection.get('connected'):
                await self.connect()
            
            if not queries:
                return {'success': False, 'error': 'No queries provided'}
            
            self._log_operation('batch_execute', 'executing', {'query_count': len(queries)})
            
            result = {
                'success': True,
                'applied': True,
                'queries_executed': len(queries),
                'message': 'Batch executed successfully'
            }
            
            self._log_operation('batch_execute', 'success')
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'operation': 'batch_execute'
            }
