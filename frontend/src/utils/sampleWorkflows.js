import { NODE_TYPES, createNodeData } from './nodeTypes';

export const getRecruitingWorkflowTemplate = () => {
  const nodes = [
    {
      id: 'start-requirement',
      type: NODE_TYPES.START,
      position: { x: 100, y: 50 },
      data: {
        ...createNodeData(NODE_TYPES.START, 'Requirement Released'),
        description: 'Hiring manager raises a new position requirement.'
      }
    },
    {
      id: 'form-requisition',
      type: NODE_TYPES.FORM,
      position: { x: 100, y: 190 },
      data: {
        ...createNodeData(NODE_TYPES.FORM, 'Job Requisition Form'),
        description: 'Capture role details, budget, and hiring justification.'
      }
    },
    {
      id: 'approval-requisition',
      type: NODE_TYPES.APPROVAL,
      position: { x: 100, y: 330 },
      data: {
        ...createNodeData(NODE_TYPES.APPROVAL, 'Requisition Approval'),
        description: 'HR / Finance approval for the new position.'
      }
    },
    {
      id: 'parallel-sourcing',
      type: NODE_TYPES.PARALLEL,
      position: { x: 100, y: 470 },
      data: {
        ...createNodeData(NODE_TYPES.PARALLEL, 'Parallel Sourcing'),
        description: 'Run multiple sourcing channels in parallel.'
      }
    },
    {
      id: 'task-job-board',
      type: NODE_TYPES.TASK,
      position: { x: -60, y: 630 },
      data: {
        ...createNodeData(NODE_TYPES.TASK, 'Job Boards'),
        description: 'Post job on external and internal job boards.'
      }
    },
    {
      id: 'task-referrals',
      type: NODE_TYPES.TASK,
      position: { x: 260, y: 630 },
      data: {
        ...createNodeData(NODE_TYPES.TASK, 'Employee Referrals'),
        description: 'Collect and manage employee referrals.'
      }
    },
    {
      id: 'merge-sourcing-complete',
      type: NODE_TYPES.MERGE,
      position: { x: 100, y: 790 },
      data: {
        ...createNodeData(NODE_TYPES.MERGE, 'Sourcing Complete'),
        description: 'All sourcing paths complete; move to screening.'
      }
    },
    {
      id: 'form-screening',
      type: NODE_TYPES.FORM,
      position: { x: 100, y: 930 },
      data: {
        ...createNodeData(NODE_TYPES.FORM, 'Candidate Screening Form'),
        description: 'Capture resume screening and phone screen outcomes.'
      }
    },
    {
      id: 'decision-shortlist',
      type: NODE_TYPES.DECISION,
      position: { x: 100, y: 1070 },
      data: {
        ...createNodeData(NODE_TYPES.DECISION, 'Shortlisted?'),
        description: 'Decide whether the candidate is shortlisted for interviews.'
      }
    },
    {
      id: 'task-schedule-interview',
      type: NODE_TYPES.TASK,
      position: { x: 100, y: 1230 },
      data: {
        ...createNodeData(NODE_TYPES.TASK, 'Schedule Interviews'),
        description: 'Schedule interview rounds with the panel.'
      }
    },
    {
      id: 'approval-hiring-manager',
      type: NODE_TYPES.APPROVAL,
      position: { x: 100, y: 1390 },
      data: {
        ...createNodeData(NODE_TYPES.APPROVAL, 'Hiring Manager Decision'),
        description: 'Hiring manager reviews feedback and decides to hire or reject.'
      }
    },
    {
      id: 'decision-offer',
      type: NODE_TYPES.DECISION,
      position: { x: 100, y: 1550 },
      data: {
        ...createNodeData(NODE_TYPES.DECISION, 'Offer Approved?'),
        description: 'Is the offer package approved by all stakeholders?'
      }
    },
    {
      id: 'action-generate-offer',
      type: NODE_TYPES.ACTION,
      position: { x: 100, y: 1710 },
      data: {
        ...createNodeData(NODE_TYPES.ACTION, 'Generate Offer Letter'),
        description: 'Generate and send the offer letter to the candidate.'
      }
    },
    {
      id: 'end-offer-extended',
      type: NODE_TYPES.END,
      position: { x: 100, y: 1870 },
      data: {
        ...createNodeData(NODE_TYPES.END, 'Offer Extended'),
        description: 'Offer has been extended to the candidate.'
      }
    },
    {
      id: 'end-rejection',
      type: NODE_TYPES.END,
      position: { x: 360, y: 1550 },
      data: {
        ...createNodeData(NODE_TYPES.END, 'Rejected'),
        description: 'Candidate rejected at shortlist or offer stage.'
      }
    }
  ];

  const edges = [
    {
      id: 'e1',
      source: 'start-requirement',
      target: 'form-requisition'
    },
    {
      id: 'e2',
      source: 'form-requisition',
      target: 'approval-requisition'
    },
    {
      id: 'e3',
      source: 'approval-requisition',
      target: 'parallel-sourcing'
    },
    {
      id: 'e4',
      source: 'parallel-sourcing',
      sourceHandle: 'pathA',
      target: 'task-job-board',
      label: 'Job Boards'
    },
    {
      id: 'e5',
      source: 'parallel-sourcing',
      sourceHandle: 'pathB',
      target: 'task-referrals',
      label: 'Referrals'
    },
    {
      id: 'e6',
      source: 'task-job-board',
      target: 'merge-sourcing-complete'
    },
    {
      id: 'e7',
      source: 'task-referrals',
      target: 'merge-sourcing-complete'
    },
    {
      id: 'e8',
      source: 'merge-sourcing-complete',
      target: 'form-screening'
    },
    {
      id: 'e9',
      source: 'form-screening',
      target: 'decision-shortlist'
    },
    {
      id: 'e10',
      source: 'decision-shortlist',
      sourceHandle: 'yes',
      target: 'task-schedule-interview',
      label: 'Shortlist'
    },
    {
      id: 'e11',
      source: 'decision-shortlist',
      sourceHandle: 'no',
      target: 'end-rejection',
      label: 'Reject'
    },
    {
      id: 'e12',
      source: 'task-schedule-interview',
      target: 'approval-hiring-manager'
    },
    {
      id: 'e13',
      source: 'approval-hiring-manager',
      target: 'decision-offer'
    },
    {
      id: 'e14',
      source: 'decision-offer',
      sourceHandle: 'yes',
      target: 'action-generate-offer',
      label: 'Approve Offer'
    },
    {
      id: 'e15',
      source: 'decision-offer',
      sourceHandle: 'no',
      target: 'end-rejection',
      label: 'Reject'
    },
    {
      id: 'e16',
      source: 'action-generate-offer',
      target: 'end-offer-extended'
    }
  ];

  return {
    id: null,
    name: 'Recruiting: Requirement to Offer',
    description: 'End-to-end recruiting workflow template from requirement release to offer extended.',
    nodes,
    edges,
    status: 'draft',
    version: 1,
    tags: ['recruiting', 'hr', 'template']
  };
};
