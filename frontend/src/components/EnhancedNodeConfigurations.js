import React from 'react';
import { Info, Plus, Trash2, Database, Filter as FilterIcon, ArrowUpDown, BarChart2, Calculator, Repeat, GitBranch, Mail, Clock, Monitor, AlertTriangle } from 'lucide-react';
import KeyValueEditor from './KeyValueEditor';
import ExpressionEditor from './ExpressionEditor';

/**
 * Enhanced Node Configuration Components
 * These are visual form-based configurations for all remaining node types
 * Part of Phase 2.2: Enhanced Node Configuration UI
 */

// Data Operations Configurations
export const DataOperationConfig = ({ 
  nodeType, 
  collection, setCollection,
  recordId, setRecordId,
  recordData, setRecordData,
  queryFilters, setQueryFilters,
  queryLimit, setQueryLimit,
  querySortBy, setQuerySortBy,
  querySortOrder, setQuerySortOrder
}) => {
  const isCreate = nodeType === 'create_record';
  const isUpdate = nodeType === 'update_record';
  const isDelete = nodeType === 'delete_record';
  const isLookup = nodeType === 'lookup_record';
  const isQuery = nodeType === 'query_records';
  const isGet = nodeType === 'get_record';

  return (
    <div className="bg-white border-2 border-emerald-200 rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        <Database className="w-4 h-4 text-emerald-600" />
        <span>Data Configuration</span>
      </h3>
      
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-emerald-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {isCreate && 'Create a new record in the database collection'}
            {isUpdate && 'Update an existing record with new data'}
            {isDelete && 'Delete a record from the database'}
            {isLookup && 'Find a record matching specific criteria'}
            {isQuery && 'Query multiple records with filters and sorting'}
            {isGet && 'Retrieve a single record by its ID'}
          </span>
        </p>
      </div>

      {/* Collection/Table Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Collection/Table Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          placeholder="e.g., users, orders, invoices"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          data-testid="collection-input"
        />
        <p className="text-xs text-slate-500 mt-1">The database collection or table to operate on</p>
      </div>

      {/* Record ID (for Update, Delete, Get) */}
      {(isUpdate || isDelete || isGet) && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Record ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="e.g., ${userId} or 12345"
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            data-testid="record-id-input"
          />
          <p className="text-xs text-slate-500 mt-1">Use ${'{'} variable{'}'} for dynamic IDs from workflow</p>
        </div>
      )}

      {/* Record Data (for Create, Update) */}
      {(isCreate || isUpdate) && (
        <KeyValueEditor
          value={recordData}
          onChange={setRecordData}
          label="Record Data"
          keyPlaceholder="Field name"
          valuePlaceholder="Field value (use ${variable})"
          allowJSON={true}
          testId="record-data-editor"
        />
      )}

      {/* Query Filters (for Lookup, Query) */}
      {(isLookup || isQuery) && (
        <>
          <KeyValueEditor
            value={queryFilters}
            onChange={setQueryFilters}
            label="Query Filters"
            keyPlaceholder="Field name"
            valuePlaceholder="Filter value (use ${variable})"
            allowJSON={true}
            testId="query-filters-editor"
          />
          
          {isQuery && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Limit (max results)
                  </label>
                  <input
                    type="number"
                    value={queryLimit}
                    onChange={(e) => setQueryLimit(e.target.value)}
                    min="1"
                    max="10000"
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    data-testid="query-limit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <select
                    value={querySortOrder}
                    onChange={(e) => setQuerySortOrder(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    data-testid="query-sort-order"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sort By Field
                </label>
                <input
                  type="text"
                  value={querySortBy}
                  onChange={(e) => setQuerySortBy(e.target.value)}
                  placeholder="e.g., createdAt, name, price"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  data-testid="query-sort-by"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// Data Transform Configurations
export const DataTransformConfig = ({ 
  nodeType,
  transformMapping, setTransformMapping,
  filterCondition, setFilterCondition,
  sortField, setSortField,
  sortOrder, setSortOrder,
  aggregateField, setAggregateField,
  aggregateOperation, setAggregateOperation,
  calculateFormula, setCalculateFormula,
  calculateOutputVar, setCalculateOutputVar,
  workflowVariables
}) => {
  const isTransform = nodeType === 'transform';
  const isFilter = nodeType === 'filter';
  const isSort = nodeType === 'sort';
  const isAggregate = nodeType === 'aggregate';
  const isCalculate = nodeType === 'calculate';

  return (
    <div className="bg-white border-2 border-lime-200 rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        {isFilter && <FilterIcon className="w-4 h-4 text-lime-600" />}
        {isSort && <ArrowUpDown className="w-4 h-4 text-lime-600" />}
        {isAggregate && <BarChart2 className="w-4 h-4 text-lime-600" />}
        {isCalculate && <Calculator className="w-4 h-4 text-lime-600" />}
        {isTransform && <Database className="w-4 h-4 text-lime-600" />}
        <span>Transform Configuration</span>
      </h3>

      <div className="bg-lime-50 border border-lime-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-lime-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {isTransform && 'Transform and map data from one format to another'}
            {isFilter && 'Filter collection items based on conditions'}
            {isSort && 'Sort collection items by a field'}
            {isAggregate && 'Calculate aggregations (sum, avg, count, etc.)'}
            {isCalculate && 'Perform mathematical calculations and formulas'}
          </span>
        </p>
      </div>

      {isTransform && (
        <KeyValueEditor
          value={transformMapping}
          onChange={setTransformMapping}
          label="Field Mapping"
          keyPlaceholder="Target field"
          valuePlaceholder="Source field (use ${variable})"
          allowJSON={true}
          testId="transform-mapping-editor"
        />
      )}

      {isFilter && (
        <ExpressionEditor
          value={filterCondition}
          onChange={setFilterCondition}
          variables={workflowVariables}
        />
      )}

      {isSort && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Sort By Field <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              placeholder="e.g., name, date, price"
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 text-sm"
              data-testid="sort-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 text-sm"
              data-testid="sort-order"
            >
              <option value="asc">Ascending (A→Z, 0→9)</option>
              <option value="desc">Descending (Z→A, 9→0)</option>
            </select>
          </div>
        </div>
      )}

      {isAggregate && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Field to Aggregate <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aggregateField}
              onChange={(e) => setAggregateField(e.target.value)}
              placeholder="e.g., amount, quantity"
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 text-sm"
              data-testid="aggregate-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Operation
            </label>
            <select
              value={aggregateOperation}
              onChange={(e) => setAggregateOperation(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 text-sm"
              data-testid="aggregate-operation"
            >
              <option value="sum">Sum (total)</option>
              <option value="avg">Average (mean)</option>
              <option value="count">Count</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>
        </div>
      )}

      {isCalculate && (
        <>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Formula/Expression <span className="text-red-500">*</span>
            </label>
            <ExpressionEditor
              value={calculateFormula}
              onChange={setCalculateFormula}
              variables={workflowVariables}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Output Variable Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={calculateOutputVar}
              onChange={(e) => setCalculateOutputVar(e.target.value)}
              placeholder="e.g., totalAmount, result"
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-lime-500 text-sm"
              data-testid="calculate-output-var"
            />
            <p className="text-xs text-slate-500 mt-1">The result will be stored in this variable</p>
          </div>
        </>
      )}
    </div>
  );
};

// Loop Configurations
export const LoopConfig = ({ 
  nodeType,
  loopCollection, setLoopCollection,
  loopItemVar, setLoopItemVar,
  loopIndexVar, setLoopIndexVar,
  whileCondition, setWhileCondition,
  repeatCount, setRepeatCount,
  maxIterations, setMaxIterations,
  workflowVariables
}) => {
  const isForEach = nodeType === 'loop_for_each';
  const isWhile = nodeType === 'loop_while';
  const isRepeat = nodeType === 'loop_repeat';

  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        <Repeat className="w-4 h-4 text-purple-600" />
        <span>Loop Configuration</span>
      </h3>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-purple-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {isForEach && 'Iterate over each item in a collection or array'}
            {isWhile && 'Repeat while a condition remains true'}
            {isRepeat && 'Repeat a fixed number of times'}
          </span>
        </p>
      </div>

      {isForEach && (
        <>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Collection Variable <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={loopCollection}
              onChange={(e) => setLoopCollection(e.target.value)}
              placeholder="e.g., ${items}, ${users}"
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              data-testid="loop-collection"
            />
            <p className="text-xs text-slate-500 mt-1">The array or collection to iterate over</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Item Variable Name
              </label>
              <input
                type="text"
                value={loopItemVar}
                onChange={(e) => setLoopItemVar(e.target.value)}
                placeholder="item"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                data-testid="loop-item-var"
              />
              <p className="text-xs text-slate-500 mt-1">Access current item as ${loopItemVar}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Index Variable Name
              </label>
              <input
                type="text"
                value={loopIndexVar}
                onChange={(e) => setLoopIndexVar(e.target.value)}
                placeholder="index"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                data-testid="loop-index-var"
              />
              <p className="text-xs text-slate-500 mt-1">Access index as ${loopIndexVar}</p>
            </div>
          </div>
        </>
      )}

      {isWhile && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            While Condition <span className="text-red-500">*</span>
          </label>
          <ExpressionEditor
            value={whileCondition}
            onChange={setWhileCondition}
            variables={workflowVariables}
          />
        </div>
      )}

      {isRepeat && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Repeat Count <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={repeatCount}
            onChange={(e) => setRepeatCount(e.target.value)}
            min="1"
            placeholder="10"
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            data-testid="repeat-count"
          />
          <p className="text-xs text-slate-500 mt-1">Number of times to repeat the loop</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Max Iterations (Safety Limit)
        </label>
        <input
          type="number"
          value={maxIterations}
          onChange={(e) => setMaxIterations(e.target.value)}
          min="1"
          placeholder="1000"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
          data-testid="max-iterations"
        />
        <p className="text-xs text-slate-500 mt-1">Loop will stop after this many iterations to prevent infinite loops</p>
      </div>

      {/* Phase 3.2: Advanced Loop Features */}
      <div className="border-t-2 border-purple-100 pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-purple-700">⚡ Advanced Options (Phase 3)</h4>
        
        {isForEach && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Batch Size (Optional)
            </label>
            <input
              type="number"
              value={loopCollection?.batchSize || ''}
              onChange={(e) => {
                const batch = e.target.value;
                if (typeof loopCollection === 'object') {
                  setLoopCollection({ ...loopCollection, batchSize: batch });
                }
              }}
              min="0"
              placeholder="0 = no batching"
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              data-testid="batch-size"
            />
            <p className="text-xs text-slate-500 mt-1">Process items in batches for better performance (0 = no batching)</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Early Exit Condition (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., ${count} > 100"
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            data-testid="break-condition"
          />
          <p className="text-xs text-slate-500 mt-1">Exit loop early when condition becomes true</p>
        </div>

        {isWhile && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Counter Variable
            </label>
            <input
              type="text"
              placeholder="loop_counter"
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              data-testid="counter-variable"
            />
            <p className="text-xs text-slate-500 mt-1">Track loop iterations in a variable</p>
          </div>
        )}

        {isRepeat && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start From
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                data-testid="start-from"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Step Increment
              </label>
              <input
                type="number"
                placeholder="1"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                data-testid="step-increment"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Assignment Configuration
export const AssignmentConfig = ({ assignments, setAssignments, workflowVariables }) => {
  const addAssignment = () => {
    setAssignments([...assignments, { variable: '', value: '', type: 'set' }]);
  };

  const updateAssignment = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    setAssignments(newAssignments);
  };

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-2 border-orange-200 rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-header font-bold text-slate-900 text-sm flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-orange-600" />
          <span>Variable Assignments</span>
        </h3>
        <button
          onClick={addAssignment}
          className="flex items-center space-x-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs font-medium"
          data-testid="add-assignment"
        >
          <Plus className="w-3 h-3" />
          <span>Add Assignment</span>
        </button>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-xs text-orange-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Set or update workflow variables with new values or calculations</span>
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-500 mb-2">No assignments configured</p>
          <button
            onClick={addAssignment}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            Click "Add Assignment" to create one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="col-span-5">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Variable</label>
                <input
                  type="text"
                  value={assignment.variable}
                  onChange={(e) => updateAssignment(index, 'variable', e.target.value)}
                  placeholder="variableName"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="col-span-6">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Value/Expression</label>
                <input
                  type="text"
                  value={assignment.value}
                  onChange={(e) => updateAssignment(index, 'value', e.target.value)}
                  placeholder="${value} or expression"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="col-span-1 pt-6">
                <button
                  onClick={() => removeAssignment(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Email Configuration
export const EmailConfig = ({ emailTo, setEmailTo, emailSubject, setEmailSubject, emailBody, setEmailBody, emailTemplate, setEmailTemplate }) => {
  return (
    <div className="bg-white border-2 border-red-200 rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        <Mail className="w-4 h-4 text-red-600" />
        <span>Email Configuration</span>
      </h3>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-red-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Send email notifications to users or external recipients</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          To (Recipients) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
          placeholder="user@example.com or ${userEmail}"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
          data-testid="email-to"
        />
        <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          placeholder="Your approval is needed for ${workflowName}"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
          data-testid="email-subject"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Body <span className="text-red-500">*</span>
        </label>
        <textarea
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          rows={6}
          placeholder="Hello ${userName},\n\nYour approval is needed...\n\nBest regards"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm resize-none"
          data-testid="email-body"
        />
        <p className="text-xs text-slate-500 mt-1">Use ${'{'} variable{'}'} to insert dynamic content</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Template (Optional)
        </label>
        <select
          value={emailTemplate}
          onChange={(e) => setEmailTemplate(e.target.value)}
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
          data-testid="email-template"
        >
          <option value="">No template (use body above)</option>
          <option value="approval">Approval Request</option>
          <option value="notification">General Notification</option>
          <option value="reminder">Reminder</option>
          <option value="welcome">Welcome Email</option>
        </select>
      </div>
    </div>
  );
};

// Wait Configuration
export const WaitConfig = ({ waitForEvent, setWaitForEvent, waitCondition, setWaitCondition, workflowVariables }) => {
  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        <Clock className="w-4 h-4 text-slate-600" />
        <span>Wait Configuration</span>
      </h3>

      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 mb-4">
        <p className="text-xs text-slate-700 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Pause workflow until a specific event occurs or condition is met</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Wait For Event
        </label>
        <input
          type="text"
          value={waitForEvent}
          onChange={(e) => setWaitForEvent(e.target.value)}
          placeholder="e.g., payment_received, approval_completed"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 text-sm"
          data-testid="wait-for-event"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Wait Condition (Optional)
        </label>
        <ExpressionEditor
          value={waitCondition}
          onChange={setWaitCondition}
          variables={workflowVariables}
        />
      </div>
    </div>
  );
};

// Screen Configuration
export const ScreenConfig = ({ screenContent, setScreenContent, screenTemplate, setScreenTemplate }) => {
  return (
    <div className="bg-white border-2 border-sky-200 rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        <Monitor className="w-4 h-4 text-sky-600" />
        <span>Screen Configuration</span>
      </h3>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-sky-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Display information or status updates to users</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={screenContent}
          onChange={(e) => setScreenContent(e.target.value)}
          rows={6}
          placeholder="Your request has been submitted.\n\nStatus: ${status}\nReference: ${refNumber}"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm resize-none"
          data-testid="screen-content"
        />
        <p className="text-xs text-slate-500 mt-1">Use ${'{'} variable{'}'} to display dynamic values</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Template (Optional)
        </label>
        <select
          value={screenTemplate}
          onChange={(e) => setScreenTemplate(e.target.value)}
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
          data-testid="screen-template"
        >
          <option value="">Plain text</option>
          <option value="success">Success Message</option>
          <option value="error">Error Message</option>
          <option value="info">Information</option>
          <option value="warning">Warning</option>
        </select>
      </div>
    </div>
  );
};

// Error Handler Configuration
export const ErrorHandlerConfig = ({ errorHandlerType, setErrorHandlerType, errorHandlerAction, setErrorHandlerAction }) => {
  return (
    <div className="bg-white border-2 border-red-300 rounded-lg p-4 shadow-sm space-y-4">
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span>Error Handler Configuration</span>
      </h3>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-red-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Handle errors and exceptions gracefully in your workflow</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Handler Type
        </label>
        <select
          value={errorHandlerType}
          onChange={(e) => setErrorHandlerType(e.target.value)}
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
          data-testid="error-handler-type"
        >
          <option value="catch">Catch Error (Handle specific errors)</option>
          <option value="finally">Finally (Always execute)</option>
          <option value="boundary">Error Boundary (Catch all in scope)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Error Action
        </label>
        <select
          value={errorHandlerAction}
          onChange={(e) => setErrorHandlerAction(e.target.value)}
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
          data-testid="error-handler-action"
        >
          <option value="retry">Retry Operation</option>
          <option value="continue">Continue Workflow</option>
          <option value="fail">Fail Workflow</option>
          <option value="fallback">Execute Fallback Path</option>
          <option value="log">Log and Continue</option>
        </select>
      </div>
    </div>
  );
};

// Switch/Case Configuration
export const SwitchConfig = ({ switchVariable, setSwitchVariable, switchCases, setSwitchCases, workflowVariables }) => {
  const addCase = () => {
    setSwitchCases([...switchCases, { value: '', label: '' }]);
  };

  const updateCase = (index, field, value) => {
    const newCases = [...switchCases];
    newCases[index][field] = value;
    setSwitchCases(newCases);
  };

  const removeCase = (index) => {
    setSwitchCases(switchCases.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-2 border-amber-200 rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-header font-bold text-slate-900 text-sm flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-amber-600" />
          <span>Switch/Case Configuration</span>
        </h3>
        <button
          onClick={addCase}
          className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs font-medium"
          data-testid="add-case"
        >
          <Plus className="w-3 h-3" />
          <span>Add Case</span>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 flex items-start space-x-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Multi-way branching based on a variable value (like switch/case in programming)</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Switch Variable <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={switchVariable}
          onChange={(e) => setSwitchVariable(e.target.value)}
          placeholder="${status} or ${type}"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
          data-testid="switch-variable"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Cases
        </label>
        {switchCases.length === 0 ? (
          <div className="text-center py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-sm text-slate-500 mb-2">No cases defined</p>
            <button
              onClick={addCase}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              Add your first case
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {switchCases.map((caseItem, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start p-2 bg-slate-50 rounded border border-slate-200">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={caseItem.value}
                    onChange={(e) => updateCase(index, 'value', e.target.value)}
                    placeholder="Case value"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    value={caseItem.label}
                    onChange={(e) => updateCase(index, 'label', e.target.value)}
                    placeholder="Label (for output handle)"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeCase(index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Loop Control Configuration (Break/Continue)
export const LoopControlConfig = ({ 
  nodeType,
  breakCondition, setBreakCondition,
  continueCondition, setContinueCondition,
  workflowVariables
}) => {
  const isBreak = nodeType === 'loop_break';
  const isContinue = nodeType === 'loop_continue';

  return (
    <div className={`bg-white border-2 ${isBreak ? 'border-rose-200' : 'border-pink-200'} rounded-lg p-4 shadow-sm space-y-4`}>
      <h3 className="section-header font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
        {isBreak && <span className="text-2xl">⛔</span>}
        {isContinue && <span className="text-2xl">⏭️</span>}
        <span>{isBreak ? 'Break Loop' : 'Continue Loop'}</span>
      </h3>

      <div className={`${isBreak ? 'bg-rose-50 border-rose-200' : 'bg-pink-50 border-pink-200'} border rounded-lg p-3 mb-4`}>
        <p className={`text-xs ${isBreak ? 'text-rose-800' : 'text-pink-800'} flex items-start space-x-2`}>
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {isBreak && 'Immediately exit the current loop and continue execution after the loop. Useful for early termination when a condition is met.'}
            {isContinue && 'Skip the rest of the current iteration and move to the next iteration. Useful for skipping specific items in a loop.'}
          </span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Condition (Optional)
        </label>
        <ExpressionEditor
          value={isBreak ? breakCondition : continueCondition}
          onChange={isBreak ? setBreakCondition : setContinueCondition}
          variables={workflowVariables}
          placeholder={isBreak ? "e.g., ${errorCount} > 5" : "e.g., ${status} === 'skip'"}
        />
        <p className="text-xs text-slate-500 mt-1">
          {isBreak ? 'Break only if this condition is true. Leave empty to always break.' : 'Continue only if this condition is true. Leave empty to always continue.'}
        </p>
      </div>

      <div className={`${isBreak ? 'bg-rose-50 border-rose-200' : 'bg-pink-50 border-pink-200'} border rounded-lg p-3`}>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">💡 Example Use Cases:</h4>
        <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
          {isBreak && (
            <>
              <li>Exit loop when processing finds the target item</li>
              <li>Stop on critical error: <code className="bg-white px-1 py-0.5 rounded text-rose-600">{'${error} !== null'}</code></li>
              <li>Limit processing: <code className="bg-white px-1 py-0.5 rounded text-rose-600">{'${processedCount} >= ${maxItems}'}</code></li>
            </>
          )}
          {isContinue && (
            <>
              <li>Skip invalid or null items in a collection</li>
              <li>Skip already processed items: <code className="bg-white px-1 py-0.5 rounded text-pink-600">{'${item.processed} === true'}</code></li>
              <li>Filter by status: <code className="bg-white px-1 py-0.5 rounded text-pink-600">{'${item.status} !== "active"'}</code></li>
            </>
          )}
        </ul>
      </div>

      <div className={`${isBreak ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3`}>
        <p className="text-xs text-slate-700 flex items-start space-x-2">
          <span className="text-lg">⚠️</span>
          <span>
            <strong>Note:</strong> This node only works inside loop nodes (For Each, While, or Repeat loops). 
            It will have no effect if placed outside a loop.
          </span>
        </p>
      </div>
    </div>
  );
};

export default {
  DataOperationConfig,
  DataTransformConfig,
  LoopConfig,
  LoopControlConfig,
  AssignmentConfig,
  EmailConfig,
  WaitConfig,
  ScreenConfig,
  ErrorHandlerConfig,
  SwitchConfig
};
