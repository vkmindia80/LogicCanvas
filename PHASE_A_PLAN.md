# Phase A – Competitive Parity Core Implementation Plan

## 🎯 Goal
Close remaining gaps with ProcessMaker's core BPM platform while keeping UX radically simpler.

**Timeline:** 10-12 weeks (2.5-3 months)  
**Success Criteria:** Users can model, secure, and publish production workflows faster than ProcessMaker

---

## 📋 Phase A Breakdown (5 Sprints)

### ✅ Current State Assessment

**What's Already Built:**
- ✅ Basic RBAC (JWT auth, 4 roles: admin/builder/approver/viewer)
- ✅ Workflow lifecycle states (draft/published/paused/archived)
- ✅ Basic versioning (version field tracked)
- ✅ 9 node types (Start, Task, Decision, Approval, Form, End, Parallel, Merge, Action)
- ✅ Execution engine with triggers
- ✅ Audit trail system
- ✅ Global search
- ✅ Import/export functionality

**What Needs Implementation:**
- ❌ BPMN-aligned elements (Timer, Event, Subprocess nodes)
- ❌ Starter workflow templates (5+ common flows)
- ❌ Workflow configuration wizard
- ❌ Workspaces/Tenants (multi-tenant isolation)
- ❌ Environment separation (dev/test/prod)
- ❌ Rich lifecycle panel with state transitions
- ❌ Version comparison UI (side-by-side diff)
- ❌ Guardrails (prevent edits on published workflows)
- ❌ Integration Hub UI
- ❌ Connector management (Email, Slack, REST, webhooks)
- ❌ Decision table nodes
- ❌ Decision table editor
- ❌ OpenAPI spec documentation
- ❌ API key management for automation

---

## 🏃 Sprint 1: BPMN Enhancements & Templates (Week 1-2)

### Objectives
- Extend node types with BPMN-aligned elements
- Create 5 starter templates for common workflows
- Build workflow configuration wizard

### Tasks

#### 1.1 New BPMN Node Types (4 days)
**Backend:**
- [ ] Add `timer` node type to execution engine
  - Support: delay, scheduled trigger, timeout
  - Configuration: duration, cron expression, timeout action
- [ ] Add `subprocess` node type
  - Support: nested workflow execution
  - Configuration: workflow_id, input mapping, output mapping
- [ ] Add `event` node types
  - Message event (send/receive)
  - Signal event (broadcast/catch)
  - Error event (throw/catch)

**Frontend:**
- [ ] Create TimerNode component with icon
- [ ] Create SubprocessNode component
- [ ] Create EventNode components (3 types)
- [ ] Add to NodePalette
- [ ] Create node editors for each type
- [ ] Update WorkflowCanvas to render new nodes

**Deliverables:**
- 3 new node types functional in canvas
- Execution engine supports new nodes
- Node editors with configuration options

---

#### 1.2 Starter Workflow Templates (3 days)
**Create 5 Production-Ready Templates:**

1. **HR Onboarding Workflow**
   - Form: New hire information
   - Tasks: Manager approval, IT setup, HR paperwork
   - Parallel: IT + HR setup
   - Approvals: Director sign-off

2. **Invoice Approval Workflow**
   - Form: Invoice details + upload
   - Decision: Amount > $10k?
   - Approval: Sequential (Manager → Director → CFO)
   - Action: Update accounting system

3. **Purchase Request Workflow**
   - Form: Purchase request details
   - Decision: Budget check
   - Approval: Department head
   - Task: Procurement team
   - Subprocess: Vendor selection (if new vendor)

4. **Contract Approval Workflow**
   - Form: Contract metadata
   - Parallel: Legal + Finance review
   - Merge: Combine reviews
   - Approval: Unanimous (Legal + Finance + Executive)
   - Action: Send to e-signature

5. **IT Support Ticket Workflow**
   - Form: Ticket submission
   - Decision: Priority triage
   - Task: Assignment by priority (high → manager, low → round-robin)
   - Timer: SLA escalation after 24h
   - Approval: Closure approval

**Implementation:**
- [ ] Create template JSON files in `/templates` directory
- [ ] Add template preview images/icons
- [ ] Enhance TemplateLibrary component to show all templates
- [ ] Add template metadata (category, complexity, estimated setup time)

**Deliverables:**
- 5 fully configured workflow templates
- Template library UI enhanced
- Templates include forms, nodes, edges, and metadata

---

#### 1.3 Workflow Configuration Wizard (3 days)
**Build Guided Wizard for New Workflows:**

**Steps:**
1. **Basics** - Name, description, category
2. **Trigger** - Manual, scheduled (cron), webhook
3. **Assignment** - Strategy (direct, role, round-robin, load-balanced)
4. **SLA** - Default due time, escalation rules
5. **Notifications** - Who gets notified and when
6. **Review** - Summary + create

**Frontend:**
- [ ] Create `WorkflowWizard.js` component
- [ ] Multi-step form with progress indicator
- [ ] Trigger configuration panel
- [ ] Assignment strategy selector
- [ ] SLA configuration
- [ ] Notification preferences
- [ ] Generate workflow JSON from wizard inputs

**Backend:**
- [ ] No backend changes needed (uses existing workflow creation endpoint)

**Deliverables:**
- Workflow wizard modal accessible from "Create Workflow" button
- Wizard generates valid workflow with configured settings
- User can skip wizard and use blank canvas

---

### Sprint 1 Success Criteria
- [ ] 3 new BPMN node types working in canvas and execution
- [ ] 5 production-ready workflow templates available
- [ ] Workflow wizard helps users create workflows in <5 minutes
- [ ] Templates can be loaded and customized immediately

---

## 🏃 Sprint 2: RBAC & Workspaces (Week 3-4)

### Objectives
- Implement multi-tenant workspace model
- Enhance RBAC with workspace-level permissions
- Add workspace switcher and settings

### Tasks

#### 2.1 Workspace/Tenant Model (4 days)
**Backend:**
- [ ] Create `workspaces` collection in MongoDB
- [ ] Add `workspace_id` field to all relevant collections
  - workflows, forms, tasks, approvals, workflow_instances, etc.
- [ ] Create workspace API endpoints
  - `POST /api/workspaces` - Create workspace
  - `GET /api/workspaces` - List user's workspaces
  - `GET /api/workspaces/{id}` - Get workspace details
  - `PUT /api/workspaces/{id}` - Update workspace settings
  - `DELETE /api/workspaces/{id}` - Archive workspace
- [ ] Add workspace membership endpoints
  - `POST /api/workspaces/{id}/members` - Add member
  - `DELETE /api/workspaces/{id}/members/{user_id}` - Remove member
  - `GET /api/workspaces/{id}/members` - List members

**Data Model:**
```json
{
  "id": "uuid",
  "name": "Production Workspace",
  "description": "Main production environment",
  "slug": "production",
  "owner_id": "user_uuid",
  "members": [
    {"user_id": "uuid", "role": "admin", "joined_at": "iso_date"}
  ],
  "settings": {
    "branding": {"logo_url": "", "primary_color": ""},
    "default_sla_hours": 24,
    "integrations": {}
  },
  "created_at": "iso_date",
  "updated_at": "iso_date"
}
```

**Frontend:**
- [ ] Create `WorkspaceContext.js` for workspace state
- [ ] Add workspace switcher in sidebar header
- [ ] Create WorkspaceSettings modal
- [ ] Add workspace filter to all data fetching
- [ ] Show current workspace name in header

**Deliverables:**
- Multi-tenant data isolation working
- Users can switch between workspaces
- Workspace settings UI functional

---

#### 2.2 Enhanced RBAC (3 days)
**Backend:**
- [ ] Update permission model with workspace roles
  - Workspace Admin, Workspace Member, Workspace Viewer
- [ ] Add permission checks to all endpoints
  - Verify user has access to workspace
  - Verify user has required role in workspace
- [ ] Create permission middleware
  - `require_workspace_access(workspace_id)`
  - `require_workspace_role(workspace_id, role)`

**Roles & Permissions Matrix:**
| Role | Create Workflows | Edit Workflows | Publish | Execute | View Only | Manage Members |
|------|------------------|----------------|---------|---------|-----------|----------------|
| Workspace Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Builder | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Approver | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Viewer | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

**Frontend:**
- [ ] Update RoleContext to include workspace roles
- [ ] Add permission checks throughout UI
- [ ] Hide/disable actions based on permissions
- [ ] Show permission denied messages

**Deliverables:**
- Workspace-level RBAC enforced on backend
- UI respects workspace permissions
- Clear permission denied feedback

---

#### 2.3 Workspace Settings Panel (3 days)
**Features:**
- [ ] Workspace details (name, description, slug)
- [ ] Member management
  - List members with roles
  - Add new members (email + role)
  - Change member roles
  - Remove members
- [ ] Branding settings
  - Upload workspace logo
  - Set primary color
- [ ] Default settings
  - Default SLA hours
  - Default notification preferences
- [ ] Danger zone
  - Archive workspace
  - Transfer ownership

**Frontend:**
- [ ] Create `WorkspaceSettings.js` component
- [ ] Member list with role badges
- [ ] Add member modal
- [ ] Settings form with tabs
- [ ] Confirmation dialogs for destructive actions

**Deliverables:**
- Complete workspace settings UI
- Member management working
- Workspace customization options

---

### Sprint 2 Success Criteria
- [ ] Multi-tenant workspaces fully functional
- [ ] Data isolation between workspaces verified
- [ ] Users can manage workspace members and settings
- [ ] RBAC enforced at workspace level

---

## 🏃 Sprint 3: Lifecycle & Versioning UX (Week 5-6)

### Objectives
- Build rich workflow lifecycle panel
- Add version comparison UI
- Implement guardrails to prevent accidental edits

### Tasks

#### 3.1 Workflow Lifecycle Panel (3 days)
**Lifecycle States:**
- Draft → In Review → Published → Paused → Archived

**State Transitions:**
- Draft → In Review (request review)
- In Review → Draft (reject)
- In Review → Published (approve)
- Published → Paused (pause)
- Paused → Published (resume)
- Published → Archived (archive)

**Backend:**
- [ ] Add `lifecycle_state` field to workflows
- [ ] Add `lifecycle_history` array to track transitions
- [ ] Create lifecycle transition endpoints
  - `POST /api/workflows/{id}/lifecycle/review` - Request review
  - `POST /api/workflows/{id}/lifecycle/approve` - Approve for publish
  - `POST /api/workflows/{id}/lifecycle/reject` - Reject review
  - `POST /api/workflows/{id}/lifecycle/pause` - Pause published workflow
  - `POST /api/workflows/{id}/lifecycle/resume` - Resume paused workflow
  - `POST /api/workflows/{id}/lifecycle/archive` - Archive workflow
- [ ] Add lifecycle validation
  - Can't execute archived workflows
  - Can't edit published workflows without creating new version
  - Track who initiated transitions

**Frontend:**
- [ ] Create `LifecyclePanel.js` component
- [ ] State visualization with progress indicator
- [ ] Action buttons based on current state
- [ ] Lifecycle history timeline
- [ ] Confirmation modals for transitions
- [ ] Show lifecycle state in workflow list

**Deliverables:**
- Workflow lifecycle panel fully functional
- State transitions enforced
- Audit trail of lifecycle changes

---

#### 3.2 Version Comparison UI (4 days)
**Features:**
- Side-by-side version comparison
- Highlight differences in:
  - Node additions/deletions
  - Node property changes
  - Edge additions/deletions
  - Workflow metadata changes
- One-click rollback to previous version

**Backend:**
- [ ] Enhance version history endpoint
  - `GET /api/workflows/{id}/versions` - List all versions
  - `GET /api/workflows/{id}/versions/{version}` - Get specific version
  - `POST /api/workflows/{id}/versions/{version}/rollback` - Rollback to version
- [ ] Implement version diff algorithm
  - Compare nodes, edges, and metadata
  - Return structured diff

**Frontend:**
- [ ] Enhance `VersionHistory.js` component
- [ ] Add "Compare" button next to each version
- [ ] Create `VersionComparison.js` modal
  - Split-screen layout
  - Left: previous version
  - Right: current version
  - Highlight differences with colors (red = removed, green = added, yellow = changed)
- [ ] Add rollback confirmation dialog
- [ ] Show version notes/comments

**Deliverables:**
- Version comparison UI working
- Visual diff highlighting changes
- Rollback functionality tested

---

#### 3.3 Guardrails & Edit Protection (3 days)
**Rules:**
1. Published workflows can't be edited directly
2. Editing published workflow creates new draft version
3. Warn users before potentially breaking changes
4. Require justification comment for major changes

**Backend:**
- [ ] Add edit protection middleware
- [ ] Auto-create new version when editing published workflow
- [ ] Add `change_notes` field to versions
- [ ] Block destructive operations on published workflows

**Frontend:**
- [ ] Show "Published" lock icon on workflows
- [ ] "Edit Published Workflow" modal
  - Explain that new version will be created
  - Require change notes
  - Show impact (e.g., "5 active instances will continue on old version")
- [ ] Show warning badges on risky operations
- [ ] Confirm dialogs for breaking changes

**Deliverables:**
- Published workflows protected from accidental edits
- Clear messaging when creating new versions
- Users understand impact of changes

---

### Sprint 3 Success Criteria
- [ ] Workflow lifecycle management working end-to-end
- [ ] Version comparison shows clear visual diffs
- [ ] Guardrails prevent accidental production changes
- [ ] Users can safely manage workflow lifecycle

---

## 🏃 Sprint 4: Integration Hub & Decision Tables (Week 7-8)

### Objectives
- Build Integration Hub for managing connectors
- Implement decision table nodes
- Create decision table editor

### Tasks

#### 4.1 Integration Hub UI (3 days)
**Features:**
- Centralized connector management
- Pre-built connectors: Email (SMTP), Slack, Teams, REST, Webhooks
- Credential storage with encryption
- Test connection functionality

**Backend:**
- [ ] Create `integrations` collection
- [ ] Add integration endpoints
  - `GET /api/integrations` - List integrations
  - `POST /api/integrations` - Create integration
  - `PUT /api/integrations/{id}` - Update integration
  - `DELETE /api/integrations/{id}` - Delete integration
  - `POST /api/integrations/{id}/test` - Test connection
- [ ] Add credential encryption (using Fernet or similar)
- [ ] Implement connector interfaces:
  - EmailConnector (SMTP)
  - SlackConnector (webhook)
  - TeamsConnector (webhook)
  - RestConnector (HTTP client)
  - WebhookConnector (POST/GET)

**Frontend:**
- [ ] Create `IntegrationHub.js` component
- [ ] Connector list with status indicators
- [ ] Add connector modal with form for each type
- [ ] Test connection button
- [ ] Credential masking (show ••••• for passwords)
- [ ] Integration icons and categories

**Deliverables:**
- Integration Hub accessible from sidebar
- Users can add and configure connectors
- Test connection validates credentials

---

#### 4.2 Decision Table Node (3 days)
**Features:**
- Visual decision table editor
- Multiple conditions and outcomes
- Hit policies: First, Collect, Priority, Any

**Backend:**
- [ ] Create `decision_tables` collection
- [ ] Add decision table endpoints
  - `POST /api/decision-tables` - Create table
  - `GET /api/decision-tables` - List tables
  - `GET /api/decision-tables/{id}` - Get table
  - `PUT /api/decision-tables/{id}` - Update table
  - `DELETE /api/decision-tables/{id}` - Delete table
  - `POST /api/decision-tables/{id}/evaluate` - Evaluate rules
- [ ] Implement decision engine
  - Parse conditions
  - Evaluate expressions
  - Apply hit policy
  - Return outcomes

**Data Model:**
```json
{
  "id": "uuid",
  "name": "Invoice Approval Rules",
  "description": "Determine approval level based on amount and category",
  "hit_policy": "first",
  "input_variables": [
    {"name": "amount", "type": "number"},
    {"name": "category", "type": "string"}
  ],
  "output_variables": [
    {"name": "approver", "type": "string"},
    {"name": "priority", "type": "string"}
  ],
  "rules": [
    {
      "conditions": {"amount": "> 10000", "category": "== 'IT'"},
      "outputs": {"approver": "CTO", "priority": "high"}
    }
  ],
  "version": 1,
  "created_at": "iso_date"
}
```

**Frontend:**
- [ ] Create `DecisionTableNode` component
- [ ] Add to NodePalette
- [ ] Create `DecisionTableEditor.js` component
  - Grid-based editor (like Excel)
  - Add/remove rows (rules)
  - Add/remove columns (variables)
  - Dropdown for hit policy
  - Expression builder for conditions
- [ ] Link decision table to node configuration
- [ ] Test rules panel

**Deliverables:**
- Decision table node working in canvas
- Decision table editor functional
- Rules execute correctly in workflows

---

#### 4.3 Decision Table Library (2 days)
**Features:**
- List all decision tables
- Create, edit, duplicate, delete tables
- Version history for tables
- Reusable across workflows

**Frontend:**
- [ ] Create `DecisionTableList.js` component
- [ ] Add to main navigation (under Forms or separate tab)
- [ ] Table list with search/filter
- [ ] Create/Edit/Delete actions
- [ ] Link to version history
- [ ] Show which workflows use each table

**Backend:**
- [ ] Track decision table usage
  - Query workflows to find references
- [ ] Add version history to decision tables

**Deliverables:**
- Decision table library accessible
- Users can manage decision tables
- Tables can be reused across workflows

---

### Sprint 4 Success Criteria
- [ ] Integration Hub manages 5+ connector types
- [ ] Decision tables can be created and edited
- [ ] Decision table nodes execute rules correctly
- [ ] Integrations can be used in Action nodes

---

## 🏃 Sprint 5: API Documentation & Polish (Week 9-10)

### Objectives
- Generate OpenAPI spec for public API
- Add API key management
- Implement environment separation
- Final polish and testing

### Tasks

#### 5.1 OpenAPI Spec Generation (3 days)
**Backend:**
- [ ] Install `fastapi[all]` if not included (includes OpenAPI support)
- [ ] Add metadata to FastAPI app
  - Title, description, version
  - Contact info, license
- [ ] Document all public API endpoints
  - Add docstrings to functions
  - Add request/response models
  - Add example payloads
  - Add error responses
- [ ] Generate OpenAPI JSON
  - Available at `/openapi.json`
- [ ] Create interactive API docs
  - Swagger UI at `/docs`
  - ReDoc at `/redoc`

**Frontend:**
- [ ] Create `APIDocs.js` component
- [ ] Embed Swagger UI in modal
- [ ] Add "API Documentation" link in settings/help menu
- [ ] Show API endpoint explorer

**Deliverables:**
- OpenAPI 3.0 spec generated
- Interactive API docs accessible
- All endpoints documented

---

#### 5.2 API Key Management (3 days)
**Features:**
- Generate API keys for automation/scripts
- Scoped permissions per key
- Key rotation and expiration
- Usage tracking

**Backend:**
- [ ] Create `api_keys` collection
- [ ] Add API key endpoints
  - `POST /api/keys` - Generate new key
  - `GET /api/keys` - List user's keys
  - `DELETE /api/keys/{id}` - Revoke key
  - `PUT /api/keys/{id}` - Update key (name, scopes)
- [ ] Implement API key authentication
  - Add `X-API-Key` header support
  - Validate key on protected endpoints
  - Check key scopes/permissions
- [ ] Track API key usage
  - Last used timestamp
  - Request count

**Data Model:**
```json
{
  "id": "uuid",
  "key": "lc_sk_...", 
  "name": "CI/CD Pipeline",
  "user_id": "uuid",
  "workspace_id": "uuid",
  "scopes": ["workflows:read", "workflows:execute"],
  "expires_at": "iso_date",
  "last_used_at": "iso_date",
  "created_at": "iso_date"
}
```

**Frontend:**
- [ ] Create `APIKeyManagement.js` component
- [ ] List API keys with masked values
- [ ] Generate new key modal
  - Name field
  - Scope/permission selector
  - Expiration date picker
  - Show full key once (copy to clipboard)
- [ ] Revoke key confirmation
- [ ] Show usage stats

**Deliverables:**
- API key generation working
- Keys can be used to authenticate API requests
- Users can manage their API keys

---

#### 5.3 Environment Separation (2 days)
**Features:**
- Dev, Test, Prod environment flags
- Workflow promotion flow
- Environment-specific settings

**Backend:**
- [ ] Add `environment` field to workspaces
- [ ] Add `target_environment` to workflows
- [ ] Create promotion endpoints
  - `POST /api/workflows/{id}/promote` - Promote to next env
  - Requires approval for prod promotion
- [ ] Add environment filters to queries

**Frontend:**
- [ ] Add environment badge to workflows
- [ ] Environment filter in workflow list
- [ ] Promote workflow button
- [ ] Confirmation dialog for promotion
- [ ] Show environment in breadcrumb

**Deliverables:**
- Workflows can be tagged with environment
- Promotion flow guides workflows from dev → test → prod
- Environment separation visible in UI

---

#### 5.4 Final Polish & Testing (2 days)
**Tasks:**
- [ ] Run full test suite on all Phase A features
- [ ] Fix any bugs discovered
- [ ] Performance testing
  - Workspace switching
  - Large workflow versioning
  - Decision table evaluation
- [ ] UX improvements
  - Loading states
  - Error messages
  - Success feedback
- [ ] Documentation
  - Update README with Phase A features
  - Create user guide for new features
  - Add admin guide for workspace management

**Deliverables:**
- All Phase A features tested and working
- No critical bugs
- Documentation updated

---

### Sprint 5 Success Criteria
- [ ] OpenAPI spec accessible and complete
- [ ] API keys can be generated and used
- [ ] Environment separation working
- [ ] All Phase A features polished and tested

---

## 🎉 Phase A Completion Checklist

### Must-Have Features (Launch Blockers)
- [ ] 3 new BPMN node types (Timer, Subprocess, Event)
- [ ] 5 starter workflow templates
- [ ] Workflow configuration wizard
- [ ] Multi-tenant workspaces with data isolation
- [ ] Enhanced RBAC with workspace permissions
- [ ] Workflow lifecycle panel (Draft → In Review → Published → Archived)
- [ ] Version comparison UI with visual diff
- [ ] Guardrails for published workflow edits
- [ ] Integration Hub with 5 connector types
- [ ] Decision table nodes with editor
- [ ] OpenAPI spec documentation
- [ ] API key management

### Nice-to-Have (Can be deferred)
- [ ] Branding customization per workspace
- [ ] Advanced approval flow for promotions
- [ ] Webhook connector testing UI
- [ ] Decision table import/export
- [ ] API rate limiting
- [ ] Advanced audit trail filters

---

## 📊 Success Metrics

**User Experience:**
- Time to create production workflow: < 5 minutes (with wizard)
- Template usage rate: > 60% of new workflows
- Version rollback success rate: 100%

**Technical:**
- API documentation completeness: 100% of public endpoints
- Workspace data isolation: 0 cross-tenant data leaks
- Decision table evaluation time: < 100ms for 100 rules

**Adoption:**
- Active workspaces per deployment: 5+
- API key generation rate: 20% of users
- Integration Hub connector usage: 40% of workflows

---

## 🚀 Next Steps

After Phase A completion, we'll be ready for:
- **Phase B**: Document Automation & IDP
- **Phase C**: AI-First Workflow Platform
- **Phase D**: Ecosystem & Enterprise

**Phase A sets the foundation for enterprise-grade workflow management that's simpler than ProcessMaker!** 🎉
