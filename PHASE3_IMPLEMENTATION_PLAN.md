# 🎯 Phase 3: Advanced Workflow Capabilities - Implementation Plan

**Status:** Ready to Start  
**Estimated Duration:** 2-3 weeks  
**Priority:** High - Final missing piece for enterprise-grade platform  
**Date Created:** December 2024

---

## 📊 Overview

Phase 3 focuses on **advanced workflow capabilities** that enable complex enterprise workflows. While Phases 1,2,4-8 have delivered a comprehensive workflow platform, Phase 3 adds the sophisticated features needed for complex business processes.

### What's Already Complete (Context):
- ✅ 150+ API endpoints
- ✅ 64 React components
- ✅ 34+ node types
- ✅ Complete execution engine
- ✅ Task & approval management
- ✅ Analytics dashboard
- ✅ API connector builder
- ✅ Advanced debugging tools

### What Phase 3 Adds:
- 🎯 **Enhanced sub-workflow support** - Nested workflows with context
- 🎯 **Advanced looping & branching** - Complex iteration logic
- 🎯 **Data transformation engine** - Visual data manipulation
- 🎯 **Integration enhancements** - Expanded connector library
- 🎯 **Document processing** - File handling capabilities

---

## 🏗️ Implementation Structure

### Priority Order:
1. **Data Transformation Engine** (High value, frequently requested)
2. **Enhanced Sub-Workflow Support** (Enterprise requirement)
3. **Advanced Looping & Branching** (Workflow complexity)
4. **Integration Enhancements** (Connector expansion)
5. **Document Processing** (Specialized feature)

---

## 📋 Detailed Implementation Plan

### **Task 3.1: Data Transformation Engine** ⏱️ 5-7 days
**Priority:** HIGH  
**Dependencies:** None

#### 3.1.1 Visual Data Mapper Component
**Frontend Component:** `/app/frontend/src/components/DataTransformationMapper.js`

**Features to Build:**
- Drag-and-drop field mapping interface
- Source → Target field connections
- Visual connection lines (like React Flow)
- Field type indicators
- Preview panel showing before/after data

**UI Design:**
```
┌──────────────────────────────────────────────────────────┐
│  Data Transformation Mapper                               │
├────────────────┬─────────────────────┬───────────────────┤
│ Source Fields  │   Connections       │  Target Fields    │
│                │                     │                   │
│ ○ user_id      │  ───────────────→  │  ○ id             │
│ ○ first_name   │  ─────┐             │  ○ full_name      │
│ ○ last_name    │  ─────┘             │  ○ email          │
│ ○ email_addr   │  ───────────────→  │  ○ status         │
│                │                     │                   │
└────────────────┴─────────────────────┴───────────────────┘
```

**Implementation:**
1. Create drag-and-drop zones for source/target
2. Use React Flow or custom SVG for connections
3. Add field type validation
4. Implement mapping rules storage
5. Add preview functionality

#### 3.1.2 Built-in Transformation Functions
**Backend File:** `/app/backend/transformation_engine.py`

**Functions to Implement:**

**String Operations:**
```python
- split(str, delimiter) → array
- join(array, delimiter) → str
- format(template, variables) → str
- uppercase(str) → str
- lowercase(str) → str
- trim(str) → str
- substring(str, start, end) → str
- replace(str, find, replace) → str
- concat(str1, str2, ...) → str
```

**Math Operations:**
```python
- sum(array) → number
- average(array) → number
- round(number, decimals) → number
- min(array) → number
- max(array) → number
- abs(number) → number
- ceil(number) → number
- floor(number) → number
```

**Date Operations:**
```python
- format_date(date, format) → str
- add_days(date, days) → date
- subtract_days(date, days) → date
- add_months(date, months) → date
- parse_date(str, format) → date
- date_diff(date1, date2) → number
- now() → date
```

**Array Operations:**
```python
- filter(array, condition) → array
- map(array, transform) → array
- reduce(array, function, initial) → value
- sort(array, order) → array
- unique(array) → array
- flatten(array) → array
- first(array) → value
- last(array) → value
- length(array) → number
```

**Object Operations:**
```python
- merge(obj1, obj2) → obj
- extract(obj, keys) → obj
- transform(obj, mapping) → obj
- keys(obj) → array
- values(obj) → array
- has_key(obj, key) → boolean
```

#### 3.1.3 Transform Node Type
**Location:** Add to `/app/frontend/src/utils/nodeTypes.js`

**Node Configuration:**
```javascript
{
  type: 'transform',
  label: 'Transform Data',
  icon: Shuffle,
  color: 'purple',
  category: 'data',
  config: {
    transformations: [],
    input_variables: [],
    output_variables: []
  }
}
```

**Node Editor UI:**
- Input variable selector
- Transformation function dropdown
- Parameters input
- Output variable name
- Add multiple transformations
- Preview result

#### 3.1.4 JSONPath Support
**Backend Implementation:**

```python
# Install jsonpath-ng
# Add to requirements.txt: jsonpath-ng==1.6.0

from jsonpath_ng import jsonpath, parse

def extract_json_path(data, path):
    """Extract data using JSONPath expression"""
    jsonpath_expr = parse(path)
    matches = jsonpath_expr.find(data)
    if len(matches) == 1:
        return matches[0].value
    return [match.value for match in matches]
```

**Frontend Component:**
- JSONPath expression builder
- Live preview with sample data
- Common path templates
- Syntax highlighting

#### 3.1.5 XML/CSV Parsing
**Backend Functions:**

```python
import xml.etree.ElementTree as ET
import csv
from io import StringIO

def parse_xml(xml_string):
    """Parse XML to dict"""
    root = ET.fromstring(xml_string)
    return xml_to_dict(root)

def parse_csv(csv_string, delimiter=','):
    """Parse CSV to list of dicts"""
    reader = csv.DictReader(StringIO(csv_string), delimiter=delimiter)
    return list(reader)

def dict_to_xml(data):
    """Convert dict to XML string"""
    # Implementation
    
def dict_to_csv(data):
    """Convert list of dicts to CSV string"""
    # Implementation
```

**Frontend UI:**
- CSV/XML parser node
- Delimiter configuration
- Header row toggle
- Preview parsed output

#### API Endpoints (Task 3.1):
```python
POST /api/transformations/test - Test transformation
POST /api/transformations/apply - Apply transformation
GET  /api/transformations/functions - List available functions
POST /api/transformations/parse-json - JSONPath extraction
POST /api/transformations/parse-xml - XML parsing
POST /api/transformations/parse-csv - CSV parsing
```

---

### **Task 3.2: Enhanced Sub-Workflow Support** ⏱️ 4-5 days
**Priority:** HIGH  
**Dependencies:** None

#### 3.2.1 Nested Workflow Execution
**Backend Enhancement:** `/app/backend/execution_engine.py`

**Current State:**
- Subprocess node exists but limited functionality

**Enhancements Needed:**
1. **Parent-Child Context Management**
```python
class SubworkflowExecutor:
    def __init__(self, parent_instance_id, child_workflow_id):
        self.parent_instance_id = parent_instance_id
        self.child_workflow_id = child_workflow_id
        self.context = {}
    
    def pass_variables(self, variable_mapping):
        """Pass variables from parent to child"""
        # Map parent variables to child input
        
    def receive_output(self, output_mapping):
        """Receive output from child to parent"""
        # Map child output to parent variables
```

2. **Hierarchy Tracking**
```python
workflow_instances: {
    "parent_instance_id": "uuid",
    "child_instances": ["uuid1", "uuid2"],
    "hierarchy_level": 0,  # 0=root, 1=child, 2=grandchild
    "context": {
        "inherited_variables": {},
        "local_variables": {}
    }
}
```

3. **Execution Coordination**
- Wait for child completion
- Handle child errors
- Aggregate child outputs
- Resume parent workflow

#### 3.2.2 Sub-Workflow Version Management
**Features:**
- Pin sub-workflow to specific version
- Auto-update to latest version option
- Version compatibility checking
- Breaking change warnings

**UI Component:** Sub-workflow version selector
```javascript
<SubworkflowVersionSelector 
  workflowId={selectedWorkflow}
  currentVersion={nodeConfig.version}
  onVersionChange={handleVersionChange}
  versioningStrategy="latest" // or "pinned"
/>
```

#### 3.2.3 Reusable Component Library
**Frontend Component:** `/app/frontend/src/components/WorkflowComponentLibrary.js`

**Features:**
- Save workflow as reusable component
- Component categories (approval, notification, data processing)
- Drag-and-drop component insertion
- Component parameters configuration
- Visual component preview

**UI Design:**
```
┌──────────────────────────────────────┐
│  Workflow Component Library          │
├──────────────────────────────────────┤
│  📁 Categories                       │
│    ├─ Approval Flows (5)            │
│    ├─ Notifications (3)             │
│    ├─ Data Processing (8)           │
│    └─ Integrations (12)             │
│                                      │
│  Component Preview:                  │
│  ┌─────────────────────────────┐   │
│  │  Multi-Level Approval       │   │
│  │  [Start]→[Task]→[Approval]  │   │
│  │  Parameters: 3 required      │   │
│  └─────────────────────────────┘   │
│                                      │
│  [Add to Workflow] [Configure]      │
└──────────────────────────────────────┘
```

#### 3.2.4 Workflow Composition Patterns
**Pre-built Patterns to Add:**

1. **Sequential Approval Chain**
   - Manager → Director → VP → CEO

2. **Parallel Task Distribution**
   - Split → [Task 1, Task 2, Task 3] → Merge

3. **Conditional Error Handling**
   - Try → Catch → Retry → Fallback

4. **Data Enrichment Pipeline**
   - Fetch → Transform → Validate → Enrich → Store

5. **Notification Cascade**
   - Event → [Email + SMS + Slack] → Log

**Implementation:**
- Store as templates in `/app/templates/patterns/`
- Add to component library
- Enable parameterization
- Support customization

#### API Endpoints (Task 3.2):
```python
GET  /api/components - List reusable components
POST /api/components - Create component
GET  /api/components/{id} - Get component
POST /api/workflows/{id}/add-component - Insert component
POST /api/subworkflows/execute - Execute sub-workflow
GET  /api/subworkflows/{id}/hierarchy - Get execution hierarchy
```

---

### **Task 3.3: Advanced Looping & Branching** ⏱️ 3-4 days
**Priority:** MEDIUM  
**Dependencies:** Data Transformation Engine (for loop conditions)

#### 3.3.1 Enhanced Loop Node
**Current State:**
- Basic loop node exists

**Enhancements:**

**Loop Types:**
1. **For-Each Loop** (iterate over array)
2. **While Loop** (condition-based)
3. **Do-While Loop** (execute at least once)
4. **For Loop** (counter-based with start/end/step)

**Loop Configuration:**
```javascript
{
  type: 'loop',
  loop_type: 'foreach', // foreach, while, dowhile, for
  config: {
    // For-Each
    array_variable: 'items',
    item_variable: 'current_item',
    index_variable: 'index',
    
    // While/Do-While
    condition: '${count} < 10',
    max_iterations: 100, // safety limit
    
    // For Loop
    start: 0,
    end: 10,
    step: 1,
    counter_variable: 'i'
  },
  loop_body: {
    nodes: [...],
    edges: [...]
  }
}
```

#### 3.3.2 Break/Continue Logic
**Implementation:**

**Break Node:**
- Exits loop immediately
- Continues to node after loop
- Can have condition: "Break if ${error_count} > 5"

**Continue Node:**
- Skips rest of current iteration
- Moves to next iteration
- Can have condition: "Continue if ${status} === 'skip'"

**UI:**
```javascript
<LoopControlNode 
  type="break" // or "continue"
  condition="optional"
  onConditionChange={handleConditionChange}
/>
```

#### 3.3.3 Nested Loops Support
**Features:**
- Support loops within loops (up to 3 levels deep)
- Visual nesting indicators
- Separate variable scopes per loop level
- Performance warnings for nested loops

**Example Use Case:**
```
Outer Loop: For each customer
  Inner Loop: For each order
    Process order items
```

#### 3.3.4 Conditional Loop Exit
**Features:**
- Multiple exit conditions
- Early termination
- Timeout exit (max duration)
- Max iterations exit

**Configuration:**
```javascript
{
  exit_conditions: [
    {
      type: 'condition',
      expression: '${success_count} >= 5',
      action: 'break'
    },
    {
      type: 'timeout',
      max_duration_seconds: 300,
      action: 'break_with_error'
    },
    {
      type: 'max_iterations',
      max_count: 1000,
      action: 'break_with_warning'
    }
  ]
}
```

#### 3.3.5 Loop Performance Optimization
**Backend Optimizations:**

1. **Parallel Loop Execution**
```python
async def execute_parallel_loop(items, max_concurrent=5):
    """Execute loop iterations in parallel"""
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [execute_iteration(item, semaphore) for item in items]
    results = await asyncio.gather(*tasks)
    return results
```

2. **Loop Result Caching**
- Cache iteration results
- Skip duplicate iterations
- Memoization for expensive operations

3. **Progress Tracking**
- Real-time loop progress
- ETA calculation
- Iteration statistics

#### API Endpoints (Task 3.3):
```python
POST /api/loops/execute - Execute loop
GET  /api/loops/{instance_id}/progress - Get loop progress
POST /api/loops/{instance_id}/break - Break loop execution
POST /api/loops/{instance_id}/continue - Continue to next iteration
GET  /api/loops/{instance_id}/stats - Get loop statistics
```

---

### **Task 3.4: Integration Enhancements** ⏱️ 3-4 days
**Priority:** MEDIUM  
**Dependencies:** API Connector Builder (already exists)

#### 3.4.1 Pre-built Connector Expansion
**Current State:**
- 10 connector templates exist (Stripe, Twilio, etc.)

**New Connectors to Add:**

**CRM Systems:**
1. **Salesforce**
   - CRUD operations on objects
   - SOQL queries
   - Bulk operations
   - OAuth 2.0 authentication

2. **HubSpot**
   - Contacts, Companies, Deals
   - Email tracking
   - Workflow triggers
   - API key authentication

**Project Management:**
3. **Jira**
   - Issue CRUD
   - Project management
   - Custom fields
   - JQL queries
   - OAuth 2.0

4. **Asana**
   - Task management
   - Project operations
   - Team collaboration
   - Personal access token

**IT Service Management:**
5. **ServiceNow**
   - Incident management
   - Change requests
   - Service catalog
   - Basic auth / OAuth

**ERP Systems:**
6. **SAP**
   - OData services
   - Business objects
   - RFC calls
   - OAuth 2.0

7. **Oracle EBS**
   - REST APIs
   - PL/SQL procedures
   - Integration repository

**Microsoft:**
8. **Microsoft Dynamics 365**
   - CRM operations
   - Sales, Service, Marketing
   - OAuth 2.0

**Implementation per Connector:**
- Template configuration JSON
- Authentication flow
- Common operations (5-10 per connector)
- Request/response mappings
- Error handling
- Documentation

#### 3.4.2 OAuth 2.0 Flow Builder
**Component:** `/app/frontend/src/components/OAuth2FlowBuilder.js`

**Features:**
- Visual OAuth flow configuration
- Authorization URL builder
- Token exchange handling
- Refresh token management
- Scope selector
- State parameter management

**Supported Grant Types:**
1. Authorization Code
2. Client Credentials
3. Resource Owner Password
4. Implicit (deprecated, but supported)

**UI:**
```
┌─────────────────────────────────────────┐
│  OAuth 2.0 Configuration                │
├─────────────────────────────────────────┤
│  Grant Type: [Authorization Code ▼]    │
│                                         │
│  Authorization URL:                     │
│  [https://auth.example.com/oauth]      │
│                                         │
│  Token URL:                             │
│  [https://auth.example.com/token]      │
│                                         │
│  Client ID: [your-client-id]           │
│  Client Secret: [••••••••••••]         │
│                                         │
│  Scopes: [☑ read ☑ write ☐ admin]     │
│                                         │
│  Redirect URI:                          │
│  [https://app.logiccanvas.com/oauth]   │
│                                         │
│  [Test Connection] [Save]               │
└─────────────────────────────────────────┘
```

#### 3.4.3 API Rate Limiting & Retry
**Backend Enhancement:**

```python
class RateLimiter:
    def __init__(self, max_requests, time_window):
        self.max_requests = max_requests  # e.g., 100
        self.time_window = time_window    # e.g., 60 seconds
        self.requests = []
    
    async def wait_if_needed(self):
        """Wait if rate limit reached"""
        now = time.time()
        # Remove old requests
        self.requests = [r for r in self.requests if now - r < self.time_window]
        
        if len(self.requests) >= self.max_requests:
            # Wait until oldest request expires
            wait_time = self.time_window - (now - self.requests[0])
            await asyncio.sleep(wait_time)
        
        self.requests.append(now)
```

**Retry Strategy:**
```python
async def api_call_with_retry(url, method, **kwargs):
    max_retries = 3
    backoff_factor = 2
    
    for attempt in range(max_retries):
        try:
            response = await http_client.request(method, url, **kwargs)
            return response
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = backoff_factor ** attempt
            await asyncio.sleep(wait_time)
```

#### 3.4.4 Connection Pooling
**Implementation:**

```python
from aiohttp import ClientSession, TCPConnector

class ConnectionPool:
    def __init__(self, max_connections=100):
        self.connector = TCPConnector(
            limit=max_connections,
            limit_per_host=30
        )
        self.session = ClientSession(connector=self.connector)
    
    async def request(self, method, url, **kwargs):
        async with self.session.request(method, url, **kwargs) as response:
            return await response.json()
```

#### 3.4.5 Webhook Management UI
**Component:** `/app/frontend/src/components/WebhookManager.js`

**Features:**
- Create/edit/delete webhooks
- Webhook URL display
- Secret key generation
- Request log viewer
- Test webhook functionality
- Webhook status (active/inactive)

**UI:**
```
┌──────────────────────────────────────────────────┐
│  Webhook Manager                                  │
├──────────────────────────────────────────────────┤
│  Active Webhooks:                                │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ Order Created Webhook                      │ │
│  │ URL: https://api.logiccanvas.com/hook/... │ │
│  │ Status: 🟢 Active                          │ │
│  │ Last Triggered: 2 mins ago                 │ │
│  │ [Test] [Edit] [View Logs] [Delete]        │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  [+ Create New Webhook]                          │
└──────────────────────────────────────────────────┘
```

#### API Endpoints (Task 3.4):
```python
GET  /api/connectors/templates/salesforce - Salesforce template
GET  /api/connectors/templates/hubspot - HubSpot template
GET  /api/connectors/templates/jira - Jira template
# ... (similar for other connectors)

POST /api/oauth/authorize - Start OAuth flow
POST /api/oauth/callback - OAuth callback
POST /api/oauth/refresh - Refresh token

GET  /api/webhooks - List webhooks
POST /api/webhooks - Create webhook
PUT  /api/webhooks/{id} - Update webhook
GET  /api/webhooks/{id}/logs - View webhook logs
POST /api/webhooks/{id}/test - Test webhook
```

---

### **Task 3.5: Document Processing** ⏱️ 2-3 days
**Priority:** LOW (Nice to have)  
**Dependencies:** None

#### 3.5.1 File Upload Node
**Frontend Component:** File Upload Node

**Features:**
- Drag-and-drop file upload
- Multiple file support
- File type restrictions
- Max file size configuration
- File storage in MongoDB GridFS

**Supported File Types:**
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- Images (.png, .jpg, .jpeg, .gif)
- Text (.txt, .csv)

#### 3.5.2 Document Extraction
**Backend Libraries:**

```python
# Add to requirements.txt
PyPDF2==3.0.1        # PDF extraction
python-docx==0.8.11   # Word documents
openpyxl==3.1.2      # Excel files
Pillow==10.0.0       # Image processing
```

**Extraction Functions:**
```python
def extract_pdf_text(file_path):
    """Extract text from PDF"""
    
def extract_docx_text(file_path):
    """Extract text from Word document"""
    
def extract_xlsx_data(file_path):
    """Extract data from Excel"""
    
def extract_image_metadata(file_path):
    """Extract image metadata"""
```

#### 3.5.3 OCR Integration
**Option 1: Tesseract (Open Source)**
```python
import pytesseract
from PIL import Image

def ocr_image(image_path):
    """Extract text from image using OCR"""
    img = Image.open(image_path)
    text = pytesseract.image_to_string(img)
    return text
```

**Option 2: Cloud OCR (Premium)**
- Google Cloud Vision API
- AWS Textract
- Azure Computer Vision

#### 3.5.4 Document Generation
**PDF Report Generation:**

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def generate_pdf_report(data, template):
    """Generate PDF report from data"""
    # Implementation using reportlab
```

**Use Cases:**
- Invoice generation
- Contract creation
- Report generation
- Certificate generation

#### 3.5.5 Digital Signature Support
**Basic Implementation:**

```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

def sign_document(document_path, private_key):
    """Add digital signature to document"""
    
def verify_signature(document_path, public_key):
    """Verify document signature"""
```

**Advanced:** Integration with DocuSign or Adobe Sign APIs

#### API Endpoints (Task 3.5):
```python
POST /api/documents/upload - Upload document
GET  /api/documents/{id} - Get document
POST /api/documents/{id}/extract - Extract text/data
POST /api/documents/{id}/ocr - OCR processing
POST /api/documents/generate - Generate document
POST /api/documents/{id}/sign - Add signature
POST /api/documents/{id}/verify - Verify signature
DELETE /api/documents/{id} - Delete document
```

---

## 🧪 Testing Strategy

### Unit Tests:
- Transformation functions (all 40+ functions)
- Loop execution logic
- Sub-workflow coordination
- Document extraction

### Integration Tests:
- Sub-workflow parent-child communication
- API connector authentication flows
- Loop with break/continue
- File upload and extraction pipeline

### E2E Tests:
- Complete workflow with transformations
- Nested sub-workflow execution
- Loop over API calls with rate limiting
- Document processing workflow

### Performance Tests:
- Large array transformations (10,000+ items)
- Nested loops (3 levels deep)
- Parallel loop execution
- Connection pool under load

---

## 📊 Success Metrics

### Functional Metrics:
- ✅ 40+ transformation functions working
- ✅ Sub-workflows can nest 3 levels deep
- ✅ Loops support break/continue
- ✅ 7+ new connector templates added
- ✅ Document extraction works for 5+ file types

### Performance Metrics:
- ⚡ Transform 1000 records in < 2 seconds
- ⚡ Sub-workflow execution overhead < 100ms
- ⚡ Loop iteration < 50ms average
- ⚡ API rate limiting prevents throttling
- ⚡ Document extraction < 5 seconds per file

### User Experience Metrics:
- 👍 Visual data mapper intuitive (< 5 min to learn)
- 👍 Component library has 10+ reusable patterns
- 👍 Loop configuration clear and simple
- 👍 OAuth flow setup < 10 steps
- 👍 Document upload drag-and-drop smooth

---

## 📁 Files to Create/Modify

### Backend Files to Create:
1. `/app/backend/transformation_engine.py` - NEW
2. `/app/backend/subworkflow_executor.py` - NEW
3. `/app/backend/loop_optimizer.py` - NEW
4. `/app/backend/document_processor.py` - NEW
5. `/app/backend/oauth_manager.py` - NEW

### Backend Files to Modify:
1. `/app/backend/server.py` - Add 30+ new endpoints
2. `/app/backend/execution_engine.py` - Enhanced loop/sub-workflow
3. `/app/backend/requirements.txt` - Add new dependencies

### Frontend Files to Create:
1. `/app/frontend/src/components/DataTransformationMapper.js` - NEW
2. `/app/frontend/src/components/WorkflowComponentLibrary.js` - NEW
3. `/app/frontend/src/components/LoopConfigPanel.js` - NEW
4. `/app/frontend/src/components/OAuth2FlowBuilder.js` - NEW
5. `/app/frontend/src/components/WebhookManager.js` - NEW
6. `/app/frontend/src/components/DocumentUploadNode.js` - NEW

### Frontend Files to Modify:
1. `/app/frontend/src/utils/nodeTypes.js` - Add transform, loop, document nodes
2. `/app/frontend/src/components/NodeEditor.js` - Add configurations
3. `/app/frontend/src/App.js` - Add new modals if needed

### Template Files to Create:
1. `/app/templates/patterns/` - 5+ composition patterns
2. `/app/templates/connectors/salesforce.json` - NEW
3. `/app/templates/connectors/hubspot.json` - NEW
4. `/app/templates/connectors/jira.json` - NEW
5. (+ 5 more connector templates)

---

## 🚀 Implementation Phases

### Week 1: Core Transformation & Sub-workflows
**Days 1-3:** Data Transformation Engine
- Transformation functions (40+)
- Visual data mapper component
- Transform node type
- Testing

**Days 4-5:** Enhanced Sub-workflows
- Parent-child context management
- Hierarchy tracking
- Component library foundation

### Week 2: Loops & Integrations
**Days 6-8:** Advanced Looping
- Enhanced loop node (4 types)
- Break/continue logic
- Nested loop support
- Performance optimization

**Days 9-10:** Integration Enhancements
- 7 new connector templates
- OAuth 2.0 flow builder
- Rate limiting & retry
- Webhook manager

### Week 3: Document Processing & Polish
**Days 11-12:** Document Processing
- File upload node
- Document extraction (5 file types)
- OCR integration (optional)
- Document generation

**Day 13:** Testing & Bug Fixes
- Unit tests
- Integration tests
- Bug fixes
- Performance tuning

**Day 14:** Documentation & Demo
- User documentation
- API documentation
- Demo workflows
- Video tutorials

---

## 🎯 Quick Start Recommendation

**If starting today, begin with Task 3.1 (Data Transformation Engine)** because:
1. High user value
2. No dependencies
3. Frequently requested
4. Enables other features
5. Can be completed in 5-7 days

**Suggested Order:**
1. Task 3.1: Data Transformation Engine (5-7 days)
2. Task 3.2: Enhanced Sub-Workflow Support (4-5 days)
3. Task 3.3: Advanced Looping & Branching (3-4 days)
4. Task 3.4: Integration Enhancements (3-4 days)
5. Task 3.5: Document Processing (2-3 days) - Optional

**Total Estimated Time:** 17-23 days (3-4 weeks)

---

## 📝 Notes

### Dependencies to Add:
```
# Python backend
jsonpath-ng==1.6.0
PyPDF2==3.0.1
python-docx==0.8.11
openpyxl==3.1.2
Pillow==10.0.0
pytesseract==0.3.10  # Optional for OCR
aiohttp==3.9.0  # For connection pooling
```

### Environment Variables:
```
# For OAuth integrations
OAUTH_REDIRECT_URL=https://app.logiccanvas.com/oauth/callback
OAUTH_STATE_SECRET=your-secret-key

# For document storage
GRIDFS_BUCKET=documents
MAX_FILE_SIZE_MB=50
```

---

**Ready to Start Phase 3!** 🚀

All prerequisites are in place. Services are running. Choose a task and begin implementation.

---

**End of Phase 3 Implementation Plan**
