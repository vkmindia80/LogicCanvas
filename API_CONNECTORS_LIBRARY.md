# API Connectors Library

This document describes the 24 popular API connectors available in the LogicCanvas API Connector Library.

## Overview

The API Connector Library now includes 24 pre-configured connectors across 8 categories, making it easy to integrate with popular third-party services.

## Connectors by Category

### 📢 Communication & Messaging (6 connectors)
1. **Slack Webhook** - Send notifications to Slack channels
2. **Telegram Bot API** - Send messages via Telegram bot
3. **Discord Webhook** - Post messages to Discord channels
4. **Twilio SMS** - Send SMS and voice messages
5. **SendGrid Email** - Send transactional emails
6. **Microsoft Teams Webhook** - Post messages to Microsoft Teams

### 👥 CRM & Sales (4 connectors)
7. **Salesforce CRM** - Integrate with Salesforce CRM
8. **HubSpot CRM** - Manage contacts and deals in HubSpot
9. **Pipedrive** - Sales pipeline management
10. **Zoho CRM** - Customer relationship management

### 📋 Project Management (4 connectors)
11. **Jira** - Issue and project tracking
12. **Asana** - Team task management
13. **Trello** - Organize projects with boards
14. **Monday.com** - Work operating system

### 💾 Cloud Storage (3 connectors)
15. **Google Drive** - File storage and sharing
16. **Dropbox** - Cloud file storage
17. **OneDrive** - Microsoft cloud storage

### 💳 Payments (2 connectors)
18. **Stripe** - Payment processing
19. **PayPal** - Online payment platform

### 📊 Marketing & Analytics (2 connectors)
20. **Mailchimp** - Email marketing platform
21. **Google Analytics** - Web analytics and reporting

### 💻 Development Tools (3 connectors)
22. **GitHub API** - Repository and code management
23. **GitLab** - DevOps platform
24. **Bitbucket** - Git repository hosting

## Authentication Types Supported

- **Webhook** - Direct webhook URLs
- **REST API** - Standard REST API with various auth methods
- **Bearer Token** - Token-based authentication
- **OAuth2** - OAuth 2.0 flow
- **Basic Auth** - Username/password authentication
- **API Key** - API key authentication

## Usage

### Accessing Connectors via API

```bash
# Get all connector templates
GET /api/connectors?is_template=true

# Get a specific connector
GET /api/connectors/{connector_id}

# Create a connector instance from template
POST /api/connectors/from-template

# Test a connector
POST /api/connectors/test
```

### Configuration

Each connector comes pre-configured with:
- **Base URL** - API endpoint
- **Authentication Type** - Required auth method
- **Placeholder Credentials** - Fields to be filled by users
- **Category** - For easy filtering and organization
- **Template Flag** - Marked as template for library usage

### Example: Using Slack Webhook

```json
{
  "name": "Slack Webhook",
  "type": "webhook",
  "category": "communication",
  "description": "Send notifications to Slack channels",
  "config": {
    "url": "https://hooks.slack.com/services/YOUR_WEBHOOK_URL",
    "auth_type": "webhook"
  }
}
```

## Adding Custom Connectors

Users can also create custom connectors by:
1. Selecting a connector type (REST, Webhook, OAuth2)
2. Configuring authentication
3. Setting up endpoints and parameters
4. Testing the connection

## Future Enhancements

Potential additions to the library:
- Amazon S3
- Azure services
- Notion API
- Airtable
- Zapier webhooks
- Linear
- Figma
- Shopify
- And many more...

## Notes

- All connectors are marked as `is_template: true` for library usage
- Users need to provide their own API keys and credentials
- Connectors are enabled by default
- Each connector has a unique ID for tracking and management

## Database Collection

Connectors are stored in the `api_connectors` MongoDB collection with the following schema:

```javascript
{
  id: String,
  name: String,
  type: String,
  category: String,
  description: String,
  config: Object,
  is_template: Boolean,
  enabled: Boolean,
  created_at: String,
  updated_at: String
}
```
