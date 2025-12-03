// Field type definitions for form builder
import { 
  Type, AlignLeft, Hash, Calendar, Clock, ChevronDown, CheckSquare, 
  Circle, ToggleLeft, Upload, Image, PenTool, Mail, Phone, Link2,
  Star, Sliders, List
} from 'lucide-react';

export const fieldTypes = [
  {
    id: 'text',
    label: 'Text Input',
    icon: Type,
    category: 'basic',
    defaultProps: {
      label: 'Text Field',
      placeholder: 'Enter text...',
      required: false,
      validation: { minLength: null, maxLength: null, pattern: null }
    }
  },
  {
    id: 'textarea',
    label: 'Text Area',
    icon: AlignLeft,
    category: 'basic',
    defaultProps: {
      label: 'Text Area',
      placeholder: 'Enter text...',
      required: false,
      rows: 4,
      validation: { minLength: null, maxLength: null }
    }
  },
  {
    id: 'number',
    label: 'Number',
    icon: Hash,
    category: 'basic',
    defaultProps: {
      label: 'Number Field',
      placeholder: '0',
      required: false,
      validation: { min: null, max: null, step: 1 }
    }
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    category: 'basic',
    defaultProps: {
      label: 'Email Address',
      placeholder: 'email@example.com',
      required: false,
      validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
    }
  },
  {
    id: 'phone',
    label: 'Phone',
    icon: Phone,
    category: 'basic',
    defaultProps: {
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      required: false,
      validation: { pattern: null }
    }
  },
  {
    id: 'url',
    label: 'URL',
    icon: Link2,
    category: 'basic',
    defaultProps: {
      label: 'Website URL',
      placeholder: 'https://example.com',
      required: false,
      validation: { pattern: '^https?://.+' }
    }
  },
  {
    id: 'date',
    label: 'Date',
    icon: Calendar,
    category: 'date-time',
    defaultProps: {
      label: 'Date',
      required: false,
      validation: { minDate: null, maxDate: null }
    }
  },
  {
    id: 'datetime',
    label: 'Date & Time',
    icon: Clock,
    category: 'date-time',
    defaultProps: {
      label: 'Date & Time',
      required: false,
      validation: {}
    }
  },
  {
    id: 'dropdown',
    label: 'Dropdown',
    icon: ChevronDown,
    category: 'choice',
    defaultProps: {
      label: 'Dropdown',
      placeholder: 'Select an option...',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3'],
      validation: {}
    }
  },
  {
    id: 'multiselect',
    label: 'Multi-Select',
    icon: CheckSquare,
    category: 'choice',
    defaultProps: {
      label: 'Multi-Select',
      placeholder: 'Select options...',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3'],
      validation: { minSelections: null, maxSelections: null }
    }
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    category: 'choice',
    defaultProps: {
      label: 'Checkbox',
      text: 'I agree to the terms',
      required: false,
      validation: {}
    }
  },
  {
    id: 'radio',
    label: 'Radio Button',
    icon: Circle,
    category: 'choice',
    defaultProps: {
      label: 'Radio Button',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3'],
      validation: {}
    }
  },
  {
    id: 'toggle',
    label: 'Toggle',
    icon: ToggleLeft,
    category: 'choice',
    defaultProps: {
      label: 'Toggle',
      text: 'Enable this option',
      required: false,
      defaultValue: false,
      validation: {}
    }
  },
  {
    id: 'file',
    label: 'File Upload',
    icon: Upload,
    category: 'media',
    defaultProps: {
      label: 'File Upload',
      required: false,
      accept: '*',
      maxSize: 10,
      validation: {}
    }
  },
  {
    id: 'image',
    label: 'Image Upload',
    icon: Image,
    category: 'media',
    defaultProps: {
      label: 'Image Upload',
      required: false,
      accept: 'image/*',
      maxSize: 5,
      validation: {}
    }
  },
  {
    id: 'signature',
    label: 'Signature',
    icon: PenTool,
    category: 'advanced',
    defaultProps: {
      label: 'Signature',
      required: false,
      validation: {}
    }
  },
  {
    id: 'rating',
    label: 'Rating',
    icon: Star,
    category: 'advanced',
    defaultProps: {
      label: 'Rating',
      required: false,
      maxRating: 5,
      validation: {}
    }
  },
  {
    id: 'slider',
    label: 'Slider',
    icon: Sliders,
    category: 'advanced',
    defaultProps: {
      label: 'Slider',
      required: false,
      min: 0,
      max: 100,
      step: 1,
      validation: {}
    }
  },
  {
    id: 'repeatable',
    label: 'Repeatable Fields',
    icon: List,
    category: 'advanced',
    defaultProps: {
      label: 'Repeatable Fields',
      required: false,
      minItems: 1,
      maxItems: 10,
      fields: [],
      validation: {}
    }
  }
];

export const getFieldTypeById = (id) => {
  return fieldTypes.find(type => type.id === id);
};

export const getFieldsByCategory = () => {
  const categories = {
    basic: [],
    'date-time': [],
    choice: [],
    media: [],
    advanced: []
  };

  fieldTypes.forEach(field => {
    if (categories[field.category]) {
      categories[field.category].push(field);
    }
  });

  return categories;
};
