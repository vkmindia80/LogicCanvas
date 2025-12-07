import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

/**
 * FieldHelp Component - Provides comprehensive field-level help for business users
 * Phase 2: Business User Experience Enhancement
 */

const FieldHelp = ({ 
  title, 
  description, 
  example, 
  learnMoreContent, 
  externalLink 
}) => {
  const [showLearnMore, setShowLearnMore] = useState(false);

  return (
    <div className="mt-1 space-y-2">
      {/* Tooltip Description */}
      {description && (
        <div className="flex items-start space-x-2 text-xs text-primary-600 bg-green-50 border border-green-200 rounded-lg p-2">
          <Info className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">{description}</p>
        </div>
      )}

      {/* Example Value */}
      {example && (
        <div className="text-xs text-primary-600 bg-green-50 border border-green-200 rounded-lg p-2">
          <span className="font-semibold text-primary-700">💡 Example: </span>
          <code className="text-primary-800 bg-white px-1.5 py-0.5 rounded border border-green-300">
            {example}
          </code>
        </div>
      )}

      {/* Learn More Expandable Section */}
      {learnMoreContent && (
        <div className="border border-green-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="w-full flex items-center justify-between px-3 py-2 bg-green-100 hover:bg-green-200 transition-colors text-xs font-medium text-primary-700"
          >
            <span>📚 Learn More</span>
            {showLearnMore ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showLearnMore && (
            <div className="p-3 bg-white text-xs text-primary-700 space-y-2 border-t border-green-200">
              {typeof learnMoreContent === 'string' ? (
                <p>{learnMoreContent}</p>
              ) : (
                learnMoreContent
              )}
            </div>
          )}
        </div>
      )}

      {/* External Documentation Link */}
      {externalLink && (
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-xs text-green-600 hover:text-green-800 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          <span>View Documentation</span>
        </a>
      )}
    </div>
  );
};

/**
 * FormField Component - Wrapper for input fields with integrated help
 */
export const FormField = ({ 
  label, 
  required = false,
  children,
  helpText,
  example,
  learnMore,
  externalLink
}) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-primary-800">
        {label}
        {required && <span className="text-gold-500 ml-1">*</span>}
      </label>
      {children}
      {(helpText || example || learnMore || externalLink) && (
        <FieldHelp
          description={helpText}
          example={example}
          learnMoreContent={learnMore}
          externalLink={externalLink}
        />
      )}
    </div>
  );
};

/**
 * Field Help Templates - Common help content for reuse
 */
export const FIELD_HELP = {
  // Basic Fields
  LABEL: {
    helpText: "A descriptive name for this step. Keep it short and clear so team members can understand what this step does at a glance.",
    example: "Approve Purchase Request",
    learnMore: "Good labels describe the action being performed. Avoid generic names like 'Task 1' or 'Step 2'. Instead use action-oriented names like 'Review Application', 'Send Email', or 'Calculate Total'."
  },
  
  DESCRIPTION: {
    helpText: "Optional detailed explanation of what happens in this step. This helps document your workflow for future reference.",
    example: "Reviews the purchase request and checks if it's within budget limits before proceeding to approval.",
    learnMore: "Descriptions are especially helpful for complex steps or when multiple people will be working with this workflow. Include any important details, business rules, or edge cases to consider."
  },

  // Task Fields
  ASSIGNEE: {
    helpText: "The person responsible for completing this task. You can assign directly to a user or dynamically based on workflow data.",
    example: "john.doe@company.com or ${manager_email}",
    learnMore: (
      <div className="space-y-2">
        <p><strong>Direct Assignment:</strong> Choose a specific person from the dropdown.</p>
        <p><strong>Dynamic Assignment:</strong> Use a variable like ${'{'}assigned_user{'}'} to assign based on workflow data.</p>
        <p><strong>Role Assignment:</strong> Assign to any user with a specific role (e.g., "Manager").</p>
      </div>
    )
  },

  ASSIGNMENT_STRATEGY: {
    helpText: "Choose how the assignee is determined for this task.",
    learnMore: (
      <div className="space-y-2">
        <p><strong>Direct:</strong> Assign to a specific user you choose.</p>
        <p><strong>Role-based:</strong> Assign to any user with a particular role.</p>
        <p><strong>Variable:</strong> Use workflow data to determine the assignee dynamically.</p>
      </div>
    )
  },

  PRIORITY: {
    helpText: "How urgent is this task? Higher priority tasks appear at the top of task lists.",
    example: "High",
    learnMore: "Priority affects task sorting and can trigger notifications. Use 'Critical' for time-sensitive tasks, 'High' for important tasks, 'Medium' for regular work, and 'Low' for tasks that can wait."
  },

  DUE_TIME: {
    helpText: "How long should the assignee have to complete this task?",
    example: "24 hours",
    learnMore: "Tasks overdue trigger SLA alerts and appear in the 'Overdue' view. Consider realistic timeframes based on task complexity and team workload."
  },

  // Decision Fields
  CONDITION: {
    helpText: "A true/false expression that determines which path the workflow takes.",
    example: "amount > 1000",
    learnMore: (
      <div className="space-y-2">
        <p><strong>Comparisons:</strong> Use {'>'}, {'<'}, {'=='}, {'!='}, {'>='}, {'<='}</p>
        <p><strong>Variables:</strong> Reference any workflow variable by name</p>
        <p><strong>Operators:</strong> Combine with 'and', 'or', 'not'</p>
        <p><strong>Examples:</strong></p>
        <ul className="ml-4 list-disc space-y-1">
          <li><code>status == "approved"</code></li>
          <li><code>total {'>'} 5000 and priority == "high"</code></li>
          <li><code>region in ["US", "CA", "MX"]</code></li>
        </ul>
      </div>
    )
  },

  // Approval Fields
  APPROVERS: {
    helpText: "Enter email addresses of people who need to approve, separated by commas.",
    example: "manager@company.com, director@company.com",
    learnMore: (
      <div className="space-y-2">
        <p><strong>Single Approver:</strong> Only one approval needed (any approver can approve)</p>
        <p><strong>All Approvers:</strong> Everyone must approve before proceeding</p>
        <p><strong>Sequential:</strong> Approvers review in order</p>
        <p>You can also use variables like ${'{'}manager_email{'}'} for dynamic approvers.</p>
      </div>
    )
  },

  APPROVAL_TYPE: {
    helpText: "Choose how many approvals are needed to proceed.",
    learnMore: (
      <div className="space-y-2">
        <p><strong>Any (Single):</strong> First person to approve moves workflow forward</p>
        <p><strong>All (Unanimous):</strong> Everyone must approve</p>
        <p><strong>Majority:</strong> More than 50% must approve</p>
        <p><strong>Sequential:</strong> Approvers review one at a time in order</p>
      </div>
    )
  },

  // Form Fields
  FORM_SELECT: {
    helpText: "Choose which form to display for data collection. The form must be created first in the Forms section.",
    learnMore: "Forms collect structured data from users. The data entered becomes available as workflow variables for use in later steps. If you don't see your form, make sure it's been saved first."
  },

  // Action/API Fields
  URL: {
    helpText: "The API endpoint URL to call. Can include workflow variables.",
    example: "https://api.example.com/users/${user_id}",
    learnMore: (
      <div className="space-y-2">
        <p><strong>Variable Interpolation:</strong> Use ${'{'}variable_name{'}'} to insert workflow data</p>
        <p><strong>Protocols:</strong> Supports http:// and https://</p>
        <p><strong>Dynamic URLs:</strong> Build URLs using data from previous steps</p>
        <p>Example: <code>https://api.stripe.com/v1/charges/${'{'}charge_id{'}'}</code></p>
      </div>
    )
  },

  HTTP_METHOD: {
    helpText: "The HTTP method for the API request.",
    learnMore: (
      <div className="space-y-2">
        <p><strong>GET:</strong> Retrieve data (read-only)</p>
        <p><strong>POST:</strong> Create new records</p>
        <p><strong>PUT:</strong> Update entire records</p>
        <p><strong>PATCH:</strong> Update specific fields</p>
        <p><strong>DELETE:</strong> Remove records</p>
      </div>
    )
  },

  HEADERS: {
    helpText: "HTTP headers as JSON. Often used for authentication and content type.",
    example: '{"Authorization": "Bearer ${api_token}", "Content-Type": "application/json"}',
    learnMore: (
      <div className="space-y-2">
        <p><strong>Common Headers:</strong></p>
        <ul className="ml-4 list-disc space-y-1">
          <li><code>Authorization</code> - API keys or tokens</li>
          <li><code>Content-Type</code> - Data format (application/json)</li>
          <li><code>Accept</code> - Expected response format</li>
        </ul>
        <p>Use workflow variables for sensitive data like ${'{'}api_key{'}'}.</p>
      </div>
    )
  },

  BODY: {
    helpText: "Request body as JSON. Used with POST, PUT, and PATCH methods.",
    example: '{"name": "${user_name}", "email": "${user_email}"}',
    learnMore: "The request body contains the data you're sending to the API. Use workflow variables with ${'{'}variable{'}'} syntax to include dynamic data from previous steps."
  },

  // Timer Fields
  DELAY: {
    helpText: "How long to wait before continuing to the next step.",
    example: "2 hours, 30 minutes",
    learnMore: "Use timers to introduce delays in your workflow, such as waiting for external processes, sending reminders, or implementing rate limiting. You can combine hours, minutes, and seconds."
  },

  SCHEDULED_TIME: {
    helpText: "A specific date and time when the workflow should continue.",
    example: "2024-12-31T23:59:59",
    learnMore: "Schedule workflows to run at specific times. Useful for daily reports, monthly processing, or time-sensitive operations. Uses ISO 8601 format or workflow variables."
  },

  // Subprocess Fields
  SUBPROCESS: {
    helpText: "Select another workflow to run as a subprocess. The parent workflow waits for the subprocess to complete.",
    learnMore: (
      <div className="space-y-2">
        <p><strong>Data Flow:</strong> Pass data from parent to subprocess using input mapping, and receive results back using output mapping.</p>
        <p><strong>Reusability:</strong> Break complex workflows into smaller, reusable pieces.</p>
        <p><strong>Use Cases:</strong> Common approval patterns, data validation, notification logic.</p>
      </div>
    )
  },

  INPUT_MAPPING: {
    helpText: "Map parent workflow variables to subprocess variables (JSON format).",
    example: '{"subprocess_user": "${parent_user}", "subprocess_amount": "${total}"}',
    learnMore: "Define which data from the current workflow should be passed to the subprocess. Keys are subprocess variable names, values are parent workflow variables."
  },

  OUTPUT_MAPPING: {
    helpText: "Map subprocess results back to parent workflow variables (JSON format).",
    example: '{"parent_result": "${subprocess_output}", "parent_status": "${subprocess_status}"}',
    learnMore: "Define how to store the subprocess results in the parent workflow. Keys are parent variable names, values are subprocess output variables."
  },

  // Loop Fields
  LOOP_ITEMS: {
    helpText: "The array variable to iterate over. Each item will be processed.",
    example: "${order_items} or ${user_list}",
    learnMore: "For-each loops process each item in an array. The current item is available as a variable inside the loop. Use this for batch processing, notifications to multiple users, or processing lists."
  },

  LOOP_CONDITION: {
    helpText: "Expression evaluated before each iteration. Loop continues while true.",
    example: "counter < 10 or status != 'complete'",
    learnMore: "While loops continue until the condition becomes false. Be careful to avoid infinite loops by ensuring the condition will eventually become false."
  },

  LOOP_COUNT: {
    helpText: "Number of times to repeat. Use for fixed iteration counts.",
    example: "5",
    learnMore: "Repeat loops run a fixed number of times. Useful for retry logic, polling, or fixed batch sizes."
  },

  // Data Operation Fields
  ENTITY_TYPE: {
    helpText: "The type of database record to work with.",
    example: "users, orders, products",
    learnMore: "Entity types correspond to your database collections/tables. Each entity type has its own set of fields and relationships."
  },

  RECORD_DATA: {
    helpText: "The data to save as JSON. Use workflow variables for dynamic values.",
    example: '{"name": "${form_name}", "email": "${form_email}", "status": "active"}',
    learnMore: "Provide all required fields for the entity type. Use ${'{'}variable{'}'} syntax to include data from previous steps like forms or API calls."
  },

  QUERY: {
    helpText: "Filter conditions to find specific records (JSON format).",
    example: '{"status": "pending", "amount": {"$gt": 1000}}',
    learnMore: (
      <div className="space-y-2">
        <p><strong>Operators:</strong></p>
        <ul className="ml-4 list-disc space-y-1">
          <li><code>$gt</code> - Greater than</li>
          <li><code>$lt</code> - Less than</li>
          <li><code>$eq</code> - Equal to</li>
          <li><code>$in</code> - In array</li>
          <li><code>$and</code>, <code>$or</code> - Combine conditions</li>
        </ul>
      </div>
    )
  }
};

export default FieldHelp;
