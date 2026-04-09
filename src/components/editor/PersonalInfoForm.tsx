'use client';

import { useResumeData } from '@/hooks/useResumeData';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
} from 'lucide-react';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-surface-600">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full rounded-lg border border-surface-200 bg-white py-2 text-sm text-surface-900
            placeholder:text-surface-400
            transition-all duration-150
            focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm
            hover:border-surface-300
            ${icon ? 'pl-9 pr-3' : 'px-3'}
          `}
        />
      </div>
    </div>
  );
}

export function PersonalInfoForm() {
  const { state, dispatch } = useResumeData();
  const { personalInfo } = state;

  function update(field: string, value: string) {
    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: { [field]: value },
    });
  }

  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-surface-400">
        Personal Information
      </h2>

      <div className="space-y-4">
        {/* Name -- 2-column grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="First Name"
            value={personalInfo.firstName}
            onChange={(v) => update('firstName', v)}
            placeholder="John"
            icon={<User className="h-4 w-4" />}
          />
          <FormField
            label="Last Name"
            value={personalInfo.lastName}
            onChange={(v) => update('lastName', v)}
            placeholder="Doe"
          />
        </div>

        {/* Email & Phone -- 2-column grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Email"
            value={personalInfo.email}
            onChange={(v) => update('email', v)}
            type="email"
            placeholder="john@example.com"
            icon={<Mail className="h-4 w-4" />}
          />
          <FormField
            label="Phone"
            value={personalInfo.phone}
            onChange={(v) => update('phone', v)}
            type="tel"
            placeholder="(555) 123-4567"
            icon={<Phone className="h-4 w-4" />}
          />
        </div>

        {/* Location */}
        <FormField
          label="Location"
          value={personalInfo.location}
          onChange={(v) => update('location', v)}
          placeholder="San Francisco, CA"
          icon={<MapPin className="h-4 w-4" />}
        />

        {/* Links -- 2-column grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Website"
            value={personalInfo.website ?? ''}
            onChange={(v) => update('website', v)}
            type="url"
            placeholder="https://example.com"
            icon={<Globe className="h-4 w-4" />}
          />
          <FormField
            label="LinkedIn"
            value={personalInfo.linkedIn ?? ''}
            onChange={(v) => update('linkedIn', v)}
            type="url"
            placeholder="https://linkedin.com/in/..."
            icon={<Linkedin className="h-4 w-4" />}
          />
        </div>

        <FormField
          label="GitHub"
          value={personalInfo.github ?? ''}
          onChange={(v) => update('github', v)}
          type="url"
          placeholder="https://github.com/..."
          icon={<Github className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
