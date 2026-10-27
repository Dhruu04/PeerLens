import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Plus, Trash2, Edit3, Check,
  Sliders, Type, ListFilter, CheckSquare, Hash,
  Sparkles, Eye, RotateCcw,
  ChevronUp, ChevronDown, ExternalLink,
  Globe, AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import FeatureInfoButton from './FeatureInfoButton';
import {
  type CustomEnrollmentField,
  type EnrollmentFieldType,
  DEFAULT_ENROLLMENT_FIELDS
} from '../utils/math';

interface EnrollmentFormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  classNameTitle?: string;
  fields: CustomEnrollmentField[];
  onSaveFields: (fields: CustomEnrollmentField[]) => void;
}

const FIELD_TYPE_CONFIG: Record<EnrollmentFieldType, {
  label: string;
  badgeLabel: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
  badgeBg: string;
}> = {
  text: {
    label: 'Text Input',
    badgeLabel: 'Text',
    icon: <Type size={14} />,
    desc: 'Freeform text (accepts words, notes, and numbers)',
    color: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.08)'
  },
  number: {
    label: 'Strictly Numeric',
    badgeLabel: 'Numeric',
    icon: <Hash size={14} />,
    desc: 'Strictly numeric digits only (e.g. GPA, years, hours)',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.08)'
  },
  dropdown: {
    label: 'Dropdown Selection',
    badgeLabel: 'Dropdown',
    icon: <ListFilter size={14} />,
    desc: 'Select from custom options you specify',
    color: '#0d9488',
    badgeBg: 'rgba(13, 148, 136, 0.08)'
  },
  boolean: {
    label: 'Checkbox',
    badgeLabel: 'Checkbox',
    icon: <CheckSquare size={14} />,
    desc: 'Interactive checkbox confirmation card',
    color: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.08)'
  }
};

const STARTER_TEMPLATES = [
  {
    label: 'Personal Laptop for Class',
    type: 'boolean' as EnrollmentFieldType,
    checkboxLabel: 'Yes, I have a personal laptop I can bring to active lab sessions',
    description: 'Hardware check for hands-on activities',
    includeInGrouping: true,
    required: true
  },
  {
    label: 'Prior Coding Experience',
    type: 'number' as EnrollmentFieldType,
    placeholder: 'Years of programming (e.g. 0, 1.5, 3)',
    description: 'Number of years programming in Python, JS, Java, or C++',
    includeInGrouping: true,
    required: false
  },
  {
    label: 'Preferred Team Role',
    type: 'dropdown' as EnrollmentFieldType,
    options: ['Project Lead & Coordinator', 'Technical Architect / Developer', 'UI/UX & Documentation Scribe', 'Research & Quality Auditor'],
    description: 'Primary responsibility you feel most comfortable leading',
    includeInGrouping: true,
    required: true
  },
  {
    label: 'Weekly Study Availability',
    type: 'number' as EnrollmentFieldType,
    placeholder: 'Estimated weekly hours available (e.g. 10)',
    description: 'Hours outside class dedicated to team deliverables',
    includeInGrouping: true,
    required: false
  },
  {
    label: 'Project Interest or Special Goals',
    type: 'text' as EnrollmentFieldType,
    placeholder: 'e.g. Interested in Fintech, healthcare AI, mobile design...',
    description: 'Specific topic interest or personal learning objectives',
    includeInGrouping: false,
    required: false
  }
];

export const EnrollmentFormBuilderModal: React.FC<EnrollmentFormBuilderModalProps> = ({
  isOpen,
  onClose,
  classId,
  classNameTitle = 'Classroom',
  fields = [],
  onSaveFields
}) => {
  // Initialize with passed fields or fall back to standard baseline questions
  const [currentFields, setCurrentFields] = useState<CustomEnrollmentField[]>(() => {
    return fields && fields.length > 0 ? fields : DEFAULT_ENROLLMENT_FIELDS;
  });

  const [activeTab, setActiveTab] = useState<'questions' | 'preview'>('questions');

  // Add / Edit Dialog State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<EnrollmentFieldType>('text');
  const [fieldCheckboxLabel, setFieldCheckboxLabel] = useState('');
  const [fieldDesc, setFieldDesc] = useState('');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldIncludeInGrouping, setFieldIncludeInGrouping] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state only when the modal opens, preventing parent re-renders from wiping active edits
  const prevIsOpenRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (fields && fields.length > 0) {
        setCurrentFields(fields);
      } else {
        setCurrentFields([...DEFAULT_ENROLLMENT_FIELDS]);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingFieldId(null);
    setFieldLabel('');
    setFieldType('text');
    setFieldCheckboxLabel('');
    setFieldDesc('');
    setFieldPlaceholder('');
    setFieldRequired(false);
    setFieldIncludeInGrouping(false);
    setFieldOptions([]);
    setNewOptionInput('');
    setErrorMsg('');
    setIsEditorOpen(true);
  };

  const handleApplyTemplate = (tmpl: typeof STARTER_TEMPLATES[0]) => {
    const isAlreadyAdded = currentFields.some(
      f => f.label.trim().toLowerCase() === tmpl.label.trim().toLowerCase()
    );
    if (isAlreadyAdded) return;

    const newField: CustomEnrollmentField = {
      id: `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      label: tmpl.label,
      type: tmpl.type,
      checkboxLabel: tmpl.checkboxLabel,
      description: tmpl.description,
      placeholder: tmpl.placeholder,
      options: tmpl.options ? [...tmpl.options] : undefined,
      required: tmpl.required,
      includeInGrouping: tmpl.includeInGrouping
    };

    const updated = [...currentFields, newField];
    setCurrentFields(updated);
    onSaveFields(updated);
  };

  const handleOpenEdit = (field: CustomEnrollmentField) => {
    setEditingFieldId(field.id);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldCheckboxLabel(field.checkboxLabel || '');
    setFieldDesc(field.description || '');
    setFieldPlaceholder(field.placeholder || '');
    setFieldRequired(!!field.required);
    setFieldIncludeInGrouping(field.includeInGrouping !== false);
    setFieldOptions(field.options ? [...field.options] : []);
    setNewOptionInput('');
    setErrorMsg('');
    setIsEditorOpen(true);
  };

  const handleAddOption = () => {
    const val = newOptionInput.trim();
    if (!val) return;
    if (fieldOptions.includes(val)) {
      setErrorMsg(`Choice "${val}" already exists.`);
      return;
    }
    setFieldOptions([...fieldOptions, val]);
    setNewOptionInput('');
    setErrorMsg('');
  };

  const handleRemoveOption = (idx: number) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== idx));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= currentFields.length) return;
    const reordered = [...currentFields];
    const temp = reordered[index];
    reordered[index] = reordered[newIdx];
    reordered[newIdx] = temp;
    setCurrentFields(reordered);
    onSaveFields(reordered);
  };

  const handleSaveField = () => {
    const trimmedLabel = fieldLabel.trim();
    if (!trimmedLabel) {
      setErrorMsg('Please enter a question or field name.');
      return;
    }

    const isDuplicate = currentFields.some(
      f => f.id !== editingFieldId && f.label.trim().toLowerCase() === trimmedLabel.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg(`A question with the name "${trimmedLabel}" already exists in this form.`);
      return;
    }

    if (fieldType === 'dropdown' && fieldOptions.length === 0) {
      setErrorMsg('Please specify at least one dropdown choice option.');
      return;
    }

    const fieldData: CustomEnrollmentField = {
      id: editingFieldId || `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      label: trimmedLabel,
      type: fieldType,
      checkboxLabel: fieldType === 'boolean' ? (fieldCheckboxLabel.trim() || undefined) : undefined,
      description: fieldDesc.trim() || undefined,
      placeholder: fieldType !== 'boolean' ? (fieldPlaceholder.trim() || undefined) : undefined,
      options: fieldType === 'dropdown' ? [...fieldOptions] : undefined,
      required: fieldRequired,
      includeInGrouping: fieldIncludeInGrouping
    };

    let updatedList: CustomEnrollmentField[];
    if (editingFieldId) {
      updatedList = currentFields.map(f => f.id === editingFieldId ? fieldData : f);
    } else {
      updatedList = [...currentFields, fieldData];
    }

    setCurrentFields(updatedList);
    onSaveFields(updatedList);
    setIsEditorOpen(false);
    setEditingFieldId(null);
    setErrorMsg('');
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleDeleteField = (idToDelete: string, label: string) => {
    const isCoreId = ['name', 'email'].includes(idToDelete);
    const confirmPrompt = isCoreId
      ? `"${label}" is an account sign-in identifier. Are you sure you want to remove it from this form?`
      : `Remove question "${label}" from the student enrollment form?`;

    setConfirmModal({
      isOpen: true,
      title: isCoreId ? 'Remove Account Identifier' : 'Remove Form Field',
      message: confirmPrompt,
      confirmText: 'Remove Field',
      cancelText: 'Cancel',
      onConfirm: () => {
        const updatedList = currentFields.filter(f => f.id !== idToDelete);
        setCurrentFields(updatedList);
        onSaveFields(updatedList);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleRequired = (id: string) => {
    const updatedList = currentFields.map(f => {
      if (f.id === id) {
        return { ...f, required: !f.required };
      }
      return f;
    });
    setCurrentFields(updatedList);
    onSaveFields(updatedList);
  };

  const handleToggleIncludeGrouping = (id: string) => {
    const updatedList = currentFields.map(f => {
      if (f.id === id) {
        return { ...f, includeInGrouping: !f.includeInGrouping };
      }
      return f;
    });
    setCurrentFields(updatedList);
    onSaveFields(updatedList);
  };

  const handleRestoreDefaults = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Enrollment Form',
      message: 'Reset this enrollment form to the standard 10 baseline course questions? Custom additions will be replaced.',
      confirmText: 'Reset to Defaults',
      cancelText: 'Cancel',
      onConfirm: () => {
        setCurrentFields(DEFAULT_ENROLLMENT_FIELDS);
        onSaveFields(DEFAULT_ENROLLMENT_FIELDS);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const previewJoinUrl = `${window.location.origin}${window.location.pathname}?enrollClassId=${classId}&preview=true`;
  const balancedCount = currentFields.filter(f => f.includeInGrouping).length;
  const requiredCount = currentFields.filter(f => f.required).length;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18)',
          overflow: 'hidden'
        }}
      >
        {/* Sleek Minimal Header */}
        <div style={{
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sliders size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Enrollment Form Questions
                </h2>
                <span className="badge badge-secondary" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                  {classNameTitle}
                </span>
                <FeatureInfoButton featureId="enrollment-builder" size="sm" tooltipText="Custom Enrollment Questions Guide" />
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                Every question is editable, reorderable, or removable. Set requirements and team balancing.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* View Switcher Pill */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'questions' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'questions' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'questions' ? 800 : 500,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'questions' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 120ms ease'
                }}
              >
                Questions ({currentFields.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'preview' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'preview' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'preview' ? 800 : 500,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'preview' ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 120ms ease'
                }}
              >
                <Eye size={12} /> Student Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Action Bar & Stats Bar */}
        <div style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentFields.length} Questions
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>•</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--teal)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={11} /> {balancedCount} Balanced in Teams
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>•</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {requiredCount} Required
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '0.35rem 0.65rem',
                borderRadius: '7px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 120ms ease'
              }}
              title="Reset the form to the default 9 standard course questions"
            >
              <RotateCcw size={12} /> Reset to Defaults
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn btn-primary btn-sm"
              style={{
                gap: '0.35rem',
                fontWeight: 800,
                fontSize: '0.78rem',
                padding: '0.38rem 0.85rem'
              }}
            >
              <Plus size={14} /> Add Question
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'var(--bg-app)',
          flex: 1
        }}>
          {activeTab === 'questions' ? (
            <>
              {/* Quick Template Chips */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.2rem' }}>
                  Quick Add:
                </span>
                {STARTER_TEMPLATES.map((tmpl, idx) => {
                  const isAdded = currentFields.some(f => f.label.trim().toLowerCase() === tmpl.label.trim().toLowerCase());
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !isAdded && handleApplyTemplate(tmpl)}
                      disabled={isAdded}
                      title={isAdded ? `"${tmpl.label}" is already added to this form` : `Add ${tmpl.label}`}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: isAdded ? 'var(--bg-card)' : 'var(--bg-app)',
                        color: isAdded ? 'var(--text-muted)' : 'var(--text-primary)',
                        opacity: isAdded ? 0.55 : 1,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: isAdded ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 120ms ease'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {isAdded ? <Check size={11} /> : <Plus size={11} />}
                        {tmpl.label}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        ({tmpl.type === 'boolean' ? 'Checkbox' : tmpl.type === 'number' ? 'Numeric' : tmpl.type})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Minimal Unified Questions List */}
              {currentFields.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  borderRadius: '12px',
                  border: '1.5px dashed var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sliders size={20} />
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    No Questions in Enrollment Form
                  </span>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
                    Students need at least basic questions to enroll. Add custom questions or restore the standard defaults.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={handleRestoreDefaults}
                      className="btn btn-secondary btn-sm"
                    >
                      <RotateCcw size={13} /> Restore Standard 10 Questions
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAdd}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus size={13} /> Add Custom Question
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentFields.map((field, idx) => {
                    const typeCfg = FIELD_TYPE_CONFIG[field.type];

                    return (
                      <div
                        key={field.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                          transition: 'all 120ms ease'
                        }}
                      >
                        {/* Left: Reorder & Number, Label, Type, Config Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                          {/* Reorder Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveField(idx, 'up')}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                opacity: idx === 0 ? 0.25 : 0.7,
                                padding: '1px',
                                color: 'var(--text-secondary)'
                              }}
                              title="Move up"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === currentFields.length - 1}
                              onClick={() => handleMoveField(idx, 'down')}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: idx === currentFields.length - 1 ? 'not-allowed' : 'pointer',
                                opacity: idx === currentFields.length - 1 ? 0.25 : 0.7,
                                padding: '1px',
                                color: 'var(--text-secondary)'
                              }}
                              title="Move down"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>

                          {/* Index Badge */}
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: 'var(--text-secondary)',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>

                          {/* Label, Type, and Details */}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {field.label}
                              </span>

                              {/* Type Badge */}
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  padding: '0.08rem 0.4rem',
                                  borderRadius: '5px',
                                  backgroundColor: typeCfg.badgeBg,
                                  color: typeCfg.color,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                {typeCfg.icon}
                                {field.type === 'dropdown' ? `Dropdown (${field.options?.length || 0})` : typeCfg.badgeLabel}
                              </span>
                            </div>

                            {/* Secondary Description or Statement Preview */}
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {field.type === 'boolean' && field.checkboxLabel
                                ? `"${field.checkboxLabel}"`
                                : field.type === 'dropdown' && field.options && field.options.length > 0
                                ? `Options: ${field.options.join(', ')}`
                                : field.description || field.placeholder || 'No extra hint specified'}
                            </div>
                          </div>
                        </div>

                        {/* Right: Quick Toggles (Required, Balanced) & Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                          {/* Required Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleRequired(field.id)}
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: field.required ? 'var(--primary)' : 'var(--border-color)',
                              backgroundColor: field.required ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              color: field.required ? 'var(--primary)' : 'var(--text-muted)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 120ms ease'
                            }}
                            title="Click to toggle required status"
                          >
                            {field.required ? 'Required *' : 'Optional'}
                          </button>

                          {/* Balanced in Teams Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleIncludeGrouping(field.id)}
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: field.includeInGrouping ? 'var(--accent-teal)' : 'var(--border-color)',
                              backgroundColor: field.includeInGrouping ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                              color: field.includeInGrouping ? 'var(--accent-teal)' : 'var(--text-muted)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 120ms ease'
                            }}
                            title="Click to toggle automatic group balancing"
                          >
                            {field.includeInGrouping && <Sparkles size={10} />}
                            {field.includeInGrouping ? 'Balanced' : 'Unbalanced'}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(field)}
                            style={{
                              padding: '0.3rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Edit question parameters"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id, field.label)}
                            style={{
                              padding: '0.3rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'transparent',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Remove this question"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (() => {
            const sec1Fields = currentFields.filter(f => ['name', 'email', 'gender'].includes(f.id));
              const sec2Fields = currentFields.filter(f => ['isInternational', 'isExchange', 'nationality', 'currentCountry'].includes(f.id));
              const sec3Fields = currentFields.filter(f => ['englishProficiency', 'degree', 'university'].includes(f.id));
              const sec4Fields = currentFields.filter(f =>
                !['name', 'email', 'gender', 'isInternational', 'isExchange', 'nationality', 'currentCountry', 'englishProficiency', 'degree', 'university'].includes(f.id)
              );

              const intlField = sec2Fields.find(f => f.id === 'isInternational');
              const exchField = sec2Fields.find(f => f.id === 'isExchange');

              return (
                <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Notice Banner */}
                  <div style={{
                    padding: '0.65rem 0.95rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem'
                  }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Eye size={13} /> Live Student Registration Portal Preview
                    </span>
                    <a
                      href={previewJoinUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--primary)',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.74rem'
                      }}
                    >
                      Open in New Tab <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* SECTION 1: IDENTITY & PROFILE */}
                  {sec1Fields.length > 0 && (
                    <div style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800 }}>
                          1
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Personal Identity &amp; Contact
                        </h4>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                        {sec1Fields.map(f => (
                          <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {f.label} {f.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                              </label>
                            </div>
                            {f.type === 'dropdown' ? (
                              <select className="form-input" style={{ height: '36px', fontSize: '0.82rem', backgroundColor: 'var(--bg-app)' }} disabled>
                                <option value="">-- Select {f.label} --</option>
                                {f.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`} className="form-input" style={{ height: '36px', fontSize: '0.82rem', backgroundColor: 'var(--bg-app)' }} disabled />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: GEOGRAPHIC & STUDENT STATUS */}
                  {sec2Fields.length > 0 && (
                    <div style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800 }}>
                          2
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Geographic &amp; Student Status
                        </h4>
                      </div>

                      {/* International & Exchange Status Checkbox Cards */}
                      {(intlField || exchField) && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                          {intlField && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              padding: '0.75rem 0.85rem',
                              borderRadius: '8px',
                              border: '1.5px solid var(--border-color)',
                              backgroundColor: 'var(--bg-app)'
                            }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid var(--text-muted)', backgroundColor: '#fff', flexShrink: 0 }} />
                              <div>
                                <b style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Globe size={13} className="text-primary" /> {intlField.label}
                                </b>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {intlField.checkboxLabel || 'Studying abroad from home country'}
                                </span>
                              </div>
                            </div>
                          )}
                          {exchField && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              padding: '0.75rem 0.85rem',
                              borderRadius: '8px',
                              border: '1.5px solid var(--border-color)',
                              backgroundColor: 'var(--bg-app)'
                            }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid var(--text-muted)', backgroundColor: '#fff', flexShrink: 0 }} />
                              <div>
                                <b style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Sparkles size={13} className="text-teal" /> {exchField.label}
                                </b>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {exchField.checkboxLabel || 'Visiting / semester exchange student'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nationality & Current Country */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                        {sec2Fields.filter(f => f.id === 'nationality' || f.id === 'currentCountry').map(f => (
                          <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {f.label} {f.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                              </label>
                            </div>
                            <input type="text" placeholder={f.placeholder || `Select or type country...`} className="form-input" style={{ height: '36px', fontSize: '0.82rem', backgroundColor: 'var(--bg-app)' }} disabled />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: ACADEMIC BACKGROUND & LANGUAGE */}
                  {sec3Fields.length > 0 && (
                    <div style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800 }}>
                          3
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Academic Background &amp; Language
                        </h4>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                        {sec3Fields.map(f => (
                          <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {f.label} {f.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                              </label>
                            </div>
                            {f.type === 'dropdown' ? (
                              <select className="form-input" style={{ height: '36px', fontSize: '0.82rem', backgroundColor: 'var(--bg-app)' }} disabled>
                                <option value="">-- Select {f.label} --</option>
                                {f.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type="text" placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`} className="form-input" style={{ height: '36px', fontSize: '0.82rem', backgroundColor: 'var(--bg-app)' }} disabled />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION 4: COURSE QUESTIONNAIRE & PREFERENCES (CUSTOM QUESTIONS) */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(139, 92, 246, 0.4)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.9rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800 }}>
                          4
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            Course Questionnaire &amp; Preferences
                          </h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Custom questions added specifically for this class
                          </span>
                        </div>
                      </div>
                    </div>

                    {sec4Fields.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '1.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px dashed var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem'
                      }}>
                        No custom questionnaire questions added yet.
                        <div style={{ marginTop: '0.4rem', fontSize: '0.72rem' }}>
                          Switch to the <b>Questions ({currentFields.length})</b> tab and click <b>+ Add Question</b> to add class-specific survey questions.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {sec4Fields.map((field, idx) => (
                          <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'block' }}>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Q{idx + 1}.</span> {field.label} {field.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                            </label>

                            {field.description && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {field.description}
                              </span>
                            )}

                            {field.type === 'boolean' ? (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                padding: '0.65rem 0.8rem',
                                borderRadius: '8px',
                                border: '1.5px solid var(--border-color)',
                                backgroundColor: '#ffffff',
                                cursor: 'pointer'
                              }}>
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '4px',
                                  border: '2px solid var(--text-muted)',
                                  backgroundColor: '#ffffff'
                                }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {field.checkboxLabel || field.label}
                                </span>
                              </div>
                            ) : field.type === 'dropdown' ? (
                              <select
                                disabled
                                className="form-input"
                                style={{ height: '36px', fontSize: '0.82rem', backgroundColor: '#ffffff' }}
                              >
                                <option value="">{field.placeholder || `-- Select ${field.label} --`}</option>
                                {field.options?.map((opt, oIdx) => (
                                  <option key={oIdx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                disabled
                                placeholder={field.placeholder || (field.type === 'number' ? 'Enter numeric digits only...' : 'Enter response...')}
                                className="form-input"
                                style={{ height: '36px', fontSize: '0.82rem', backgroundColor: '#ffffff' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Modal Bottom Action Bar */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <a
            href={previewJoinUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.76rem',
              fontWeight: 650,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Eye size={13} /> Open Live Student Portal &rarr;
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onSaveFields(currentFields);
                onClose();
              }}
              style={{
                padding: '0.45rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Check size={14} strokeWidth={2.5} /> Save &amp; Update Form
            </button>
          </div>
        </div>

        {/* Add / Edit Question Submodal */}
        {isEditorOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 10005,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setIsEditorOpen(false)}
          >
            <div
              style={{
                maxWidth: '520px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {editingFieldId ? 'Edit Question' : 'Add Question to Form'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <X size={16} />
                </button>
              </div>

              {errorMsg && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '7px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.74rem', fontWeight: 600 }}>
                  {errorMsg}
                </div>
              )}

              {/* 4 Type Selector Pills */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Select Question Response Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                  {(['text', 'number', 'dropdown', 'boolean'] as EnrollmentFieldType[]).map((typeKey) => {
                    const cfg = FIELD_TYPE_CONFIG[typeKey];
                    const isSelected = fieldType === typeKey;

                    return (
                      <div
                        key={typeKey}
                        onClick={() => setFieldType(typeKey)}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? cfg.color : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? cfg.badgeBg : 'var(--bg-app)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 120ms ease'
                        }}
                      >
                        <div style={{ color: cfg.color }}>{cfg.icon}</div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: isSelected ? 800 : 600, color: 'var(--text-primary)' }}>
                            {cfg.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Title */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Question Title / Prompt <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Do you have a personal laptop for class?"
                  className="form-input"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  style={{ height: '36px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Type-Specific Options */}
              {fieldType === 'boolean' && (
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Checkbox Confirmation Statement (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Yes, I have a laptop I will bring to lab sessions"
                    className="form-input"
                    value={fieldCheckboxLabel}
                    onChange={(e) => setFieldCheckboxLabel(e.target.value)}
                    style={{ height: '36px', fontSize: '0.82rem' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Label shown right next to the checkbox input.
                  </span>
                </div>
              )}

              {fieldType === 'dropdown' && (
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Dropdown Choices ({fieldOptions.length}) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.45rem' }}>
                    <input
                      type="text"
                      placeholder="Type choice and press Add..."
                      className="form-input"
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      style={{ height: '34px', fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0 0.75rem', fontSize: '0.76rem', fontWeight: 700 }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '100px', overflowY: 'auto' }}>
                    {fieldOptions.map((opt, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(13, 148, 136, 0.08)',
                          color: 'var(--teal)',
                          fontWeight: 600,
                          border: '1px solid rgba(13, 148, 136, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {opt}
                        <X
                          size={11}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveOption(i)}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {fieldType !== 'boolean' && (
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Placeholder Text (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Enter details..."
                    className="form-input"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                    style={{ height: '36px', fontSize: '0.82rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Help / Guidance Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Explained briefly to assist students..."
                  className="form-input"
                  value={fieldDesc}
                  onChange={(e) => setFieldDesc(e.target.value)}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div
                  onClick={() => setFieldRequired(!fieldRequired)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${fieldRequired ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: fieldRequired ? 'rgba(99, 102, 241, 0.06)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: `1.5px solid ${fieldRequired ? 'var(--primary)' : 'var(--text-muted)'}`,
                    backgroundColor: fieldRequired ? 'var(--primary)' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    {fieldRequired && <Check size={11} strokeWidth={3} />}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                      Required Question
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                      Students must answer
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setFieldIncludeInGrouping(!fieldIncludeInGrouping)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${fieldIncludeInGrouping ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                    backgroundColor: fieldIncludeInGrouping ? 'rgba(20, 184, 166, 0.06)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: `1.5px solid ${fieldIncludeInGrouping ? 'var(--accent-teal)' : 'var(--text-muted)'}`,
                    backgroundColor: fieldIncludeInGrouping ? 'var(--accent-teal)' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    {fieldIncludeInGrouping && <Check size={11} strokeWidth={3} />}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Sparkles size={11} className="text-teal" /> Team Balancing
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                      Equalized in Auto-Group
                    </span>
                  </div>
                </div>
              </div>

              {/* Submodal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditorOpen(false)}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveField}
                  style={{ padding: '0.4rem 1.1rem', fontSize: '0.78rem', fontWeight: 800 }}
                >
                  Save Question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          title={confirmModal.title}
          maxWidth="440px"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className="btn btn-rose"
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'center', textAlign: 'center', padding: '0.75rem 0' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertCircle size={24} />
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
          </div>
        </Modal>
      )}
    </div>,
    document.body
  );
};

export default EnrollmentFormBuilderModal;
