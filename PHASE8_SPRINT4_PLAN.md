# Phase 8 Sprint 4: Advanced Features - Implementation Plan

## 🎯 Overview
Implement **both tracks** of advanced features for LogicCanvas:
1. **Visual API Connector Builder** - Build and manage API integrations visually
2. **Advanced Debugging Features** - Professional debugging tools for workflow development

## 📋 Track 1: Visual API Connector Builder (8.5)

### Features
1. **Visual REST API Builder Interface**
   - Drag-and-drop interface for building API connectors
   - Visual request builder with live preview
   - Response viewer with JSON formatting
   - Save connectors to library for reuse

2. **Request Configuration**
   - HTTP Method selector (GET, POST, PUT, PATCH, DELETE)
   - URL builder with variable interpolation
   - Headers manager (add/remove custom headers)
   - Request body editor (JSON, Form Data, Raw)
   - Query parameters builder

3. **Authentication Templates**
   - OAuth 2.0 flow (Authorization Code, Client Credentials)
   - API Key (header, query parameter)
   - Basic Auth (username/password)
   - Bearer Token
   - Custom authentication

4. **Response Mapping**
   - Visual mapper for API response → workflow variables
   - JSON path selector for nested data
   - Type conversion (string, number, boolean, array, object)
   - Transform functions (uppercase, lowercase, parse, format)

5. **Pre-built Connector Library**
   - Stripe (payments, customers, invoices)
   - Twilio (SMS, calls)
   - SendGrid (emails)
   - Slack (messages, channels)
   - GitHub (repos, issues, PRs)
   - Google Sheets (read/write)
   - OpenAI (completions, embeddings)
   - More connectors...

6. **Request/Response Testing**
   - Test button to execute API call
   - Response preview with status code
   - Error handling preview
   - Save successful tests

### Backend Components

#### New MongoDB Collection: `api_connectors`
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "category": "payment|communication|storage|ai|custom",
  "is_template": false,
  "config": {
    "method": "GET|POST|PUT|PATCH|DELETE",
    "url": "string",
    "headers": {"key": "value"},
    "query_params": {"key": "value"},
    "body": "string|object",
    "auth": {
      "type": "none|oauth2|api_key|basic|bearer|custom",
      "config": {}
    }
  },
  "response_mapping": [
    {
      "source_path": "$.data.id",
      "target_variable": "user_id",
      "type": "string",
      "transform": "none|uppercase|lowercase|parse_json|format_date"
    }
  ],
  "error_handling": {
    "retry_count": 3,
    "retry_delay": 1000,
    "timeout": 30000,
    "on_error": "fail|continue|retry"
  },
  "created_at": "iso_date",
  "updated_at": "iso_date"
}
```

#### API Endpoints
```python
GET    /api/connectors                    # List all connectors
GET    /api/connectors/templates          # Get pre-built templates
GET    /api/connectors/{id}               # Get connector by ID
POST   /api/connectors                    # Create new connector
PUT    /api/connectors/{id}               # Update connector
DELETE /api/connectors/{id}               # Delete connector
POST   /api/connectors/{id}/test          # Test connector
POST   /api/connectors/execute            # Execute connector in workflow
```

### Frontend Components

1. **APIConnectorBuilder.js** - Main builder interface
2. **ConnectorLibrary.js** - Browse and select templates
3. **RequestConfigurator.js** - Configure API request
4. **AuthTemplateSelector.js** - Choose auth method
5. **ResponseMapper.js** - Map response to variables
6. **ConnectorTester.js** - Test API calls
7. **ConnectorCard.js** - Display connector in list

---

## 📋 Track 2: Advanced Debugging Features (8.8)

### Features

1. **Breakpoints on Nodes**
   - Click node to set/remove breakpoint
   - Visual breakpoint indicator (red dot)
   - Breakpoint list panel
   - Enable/disable breakpoints
   - Conditional breakpoints (break when variable == value)

2. **Step-Through Execution Mode**
   - Play/Pause/Step buttons
   - Step Over (execute current node, move to next)
   - Step Into (enter subprocesses)
   - Step Out (exit subprocess)
   - Continue (run until next breakpoint)
   - Current execution pointer (highlighted node)

3. **Enhanced Variable Watch Panel**
   - Pin important variables to top
   - Collapsible variable groups
   - Show variable changes in real-time
   - Diff view (before/after values)
   - Export variable state to JSON

4. **Execution Timeline View**
   - Visual timeline of node executions
   - Duration bars per node
   - Hover to see details
   - Click to jump to node
   - Replay execution from any point
   - Zoom in/out on timeline

5. **Node Execution Logs**
   - Detailed logs per node
   - Filter by level (debug, info, warning, error)
   - Search logs
   - Export logs to file
   - Timestamps with millisecond precision

6. **Performance Profiling**
   - Total execution time
   - Time per node (bar chart)
   - Slowest nodes highlighted
   - Memory usage (if available)
   - API call durations
   - Recommendations for optimization

### Backend Components

#### Enhanced `workflow_instances` Collection
```json
{
  "debug_mode": false,
  "breakpoints": [
    {
      "node_id": "uuid",
      "enabled": true,
      "condition": "variable == value"
    }
  ],
  "execution_logs": [
    {
      "timestamp": "iso_date_with_ms",
      "node_id": "uuid",
      "level": "debug|info|warning|error",
      "message": "string",
      "data": {}
    }
  ],
  "performance_profile": {
    "total_duration_ms": 1234,
    "nodes": [
      {
        "node_id": "uuid",
        "duration_ms": 123,
        "memory_mb": 45.6,
        "api_calls": 2
      }
    ]
  },
  "execution_timeline": [
    {
      "node_id": "uuid",
      "start_time": "iso_date_with_ms",
      "end_time": "iso_date_with_ms",
      "duration_ms": 123,
      "status": "completed|error|waiting"
    }
  ]
}
```

#### API Endpoints
```python
# Breakpoints
POST   /api/instances/{id}/breakpoints           # Add breakpoint
DELETE /api/instances/{id}/breakpoints/{node_id} # Remove breakpoint
PUT    /api/instances/{id}/breakpoints/{node_id} # Update breakpoint
GET    /api/instances/{id}/breakpoints           # List breakpoints

# Step-through execution
POST   /api/instances/{id}/debug/step            # Step to next node
POST   /api/instances/{id}/debug/continue        # Continue execution
POST   /api/instances/{id}/debug/pause           # Pause execution
GET    /api/instances/{id}/debug/state           # Get current debug state

# Execution logs
GET    /api/instances/{id}/logs                  # Get execution logs
POST   /api/instances/{id}/logs                  # Add log entry

# Performance profiling
GET    /api/instances/{id}/performance           # Get performance data
GET    /api/instances/{id}/timeline              # Get execution timeline
```

### Frontend Components

1. **DebugPanel.js** - Main debugging interface (tabbed)
2. **BreakpointManager.js** - Manage breakpoints
3. **StepController.js** - Step-through controls
4. **ExecutionTimeline.js** - Visual timeline
5. **PerformanceProfiler.js** - Performance metrics
6. **NodeExecutionLogs.js** - Log viewer
7. **EnhancedVariableWatch.js** - Upgraded variable inspector

---

## 🎨 UI/UX Design

### API Connector Builder Layout
```
┌─────────────────────────────────────────────────────────┐
│  API Connector Builder                    [Save] [Test]  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Templates   │  Request Configuration                   │
│  ───────────│                                          │
│  □ Stripe    │  Method: [POST ▼]                       │
│  □ Twilio    │  URL: https://api.example.com/users     │
│  □ SendGrid  │                                          │
│  □ Slack     │  Headers                                 │
│  □ GitHub    │  ┌────────────────┬──────────────────┐  │
│  □ OpenAI    │  │ Content-Type   │ application/json │  │
│              │  │ Authorization  │ Bearer ${token}  │  │
│  + Custom    │  └────────────────┴──────────────────┘  │
│              │                                          │
│              │  Body (JSON)                             │
│              │  ┌────────────────────────────────────┐ │
│              │  │ {                                  │ │
│              │  │   "name": "${user_name}",         │ │
│              │  │   "email": "${user_email}"        │ │
│              │  │ }                                  │ │
│              │  └────────────────────────────────────┘ │
│              │                                          │
│              │  Response Mapping                        │
│              │  $.data.id → user_id (String)           │
│              │  $.data.name → user_name (String)       │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Debug Panel Layout
```
┌─────────────────────────────────────────────────────────┐
│  Debug Panel              [▶ Play] [⏸ Pause] [➡ Step]  │
├─────────────────────────────────────────────────────────┤
│  [Breakpoints] [Timeline] [Logs] [Performance] [Watch]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Execution Timeline (3.5s total)                        │
│  ┌────┬────────┬──┬─────────┬────┬──────────────┐     │
│  │ S  │ Task   │D │ Approval│ A  │   End        │     │
│  │    │ (1.2s) │  │ (2.1s)  │    │   (0.1s)     │     │
│  └────┴────────┴──┴─────────┴────┴──────────────┘     │
│  0s               1s                 2s          3s    │
│                                                         │
│  Current Node: Task #2 (line 45)                       │
│  Variables: user_id=123, status=pending                │
│                                                         │
│  Performance:                                           │
│  Slowest Nodes:                                         │
│  1. Approval Node (2.1s) ⚠️                            │
│  2. Task Node (1.2s)                                    │
│  3. API Call (0.8s)                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### API Connector Builder
- [ ] Can create custom API connector from scratch
- [ ] Can select and customize pre-built templates
- [ ] Authentication methods work (OAuth, API Key, Basic)
- [ ] Response mapping correctly maps to workflow variables
- [ ] Test function successfully executes API calls
- [ ] Connectors can be saved and reused
- [ ] Integration with API Call nodes works seamlessly

### Advanced Debugging
- [ ] Breakpoints can be set/removed on any node
- [ ] Step-through execution pauses at each node
- [ ] Execution timeline shows all node executions
- [ ] Performance profiler identifies slow nodes
- [ ] Logs can be filtered and searched
- [ ] Variable watch panel shows real-time updates
- [ ] Replay execution works from any timeline point

---

## 🚀 Implementation Order

### Phase 1: Backend Infrastructure (1-1.5 hours)
1. Create `api_connectors` collection and models
2. Implement connector CRUD endpoints
3. Create connector templates (Stripe, Twilio, etc.)
4. Add test execution endpoint
5. Enhance execution engine with debugging support
6. Add breakpoint management endpoints
7. Implement logging infrastructure
8. Add performance profiling

### Phase 2: API Connector Builder UI (1.5-2 hours)
1. Build ConnectorLibrary component
2. Create APIConnectorBuilder main interface
3. Implement RequestConfigurator
4. Build AuthTemplateSelector
5. Create ResponseMapper
6. Add ConnectorTester
7. Integrate with WorkflowCanvas

### Phase 3: Debugging Tools UI (1.5-2 hours)
1. Create DebugPanel main component
2. Build BreakpointManager
3. Implement StepController
4. Create ExecutionTimeline visualization
5. Build PerformanceProfiler
6. Enhance NodeExecutionLogs
7. Upgrade VariableWatch panel

### Phase 4: Integration & Testing (1 hour)
1. Integrate debugging with execution engine
2. Test API connectors with real APIs
3. Test step-through execution
4. Verify performance profiling
5. Test timeline replay
6. End-to-end testing

**Total Estimated Time: 5-6.5 hours**

---

## 📝 Documentation

- API Connector Builder guide
- Pre-built connector documentation
- Authentication setup guides
- Debugging workflow tutorial
- Performance optimization tips
- API reference updates

---

**Status:** 🚧 In Progress
**Started:** Today
**Target Completion:** Today (5-6 hours)
**Tracks:** Both (API Connector Builder + Advanced Debugging)
