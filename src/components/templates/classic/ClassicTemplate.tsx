'use client';

import type { TemplateProps } from '@/types/template';
import type {
  ResumeSection,
  SectionEntry,
  SummaryEntry,
  ExperienceEntry,
  EducationEntry,
  SkillsEntry,
  CustomEntry,
} from '@/types/resume';
import {
  formatDateRange,
  buildFullName,
  getVisibleSections,
  isEmptyHTML,
} from '../shared/template-utils';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_ACCENT = '#2563eb';

// =============================================================================
// Contact Info Row
// =============================================================================

interface ContactItemProps {
  value: string | undefined;
  href?: string;
}

function ContactInfo({
  email,
  phone,
  location,
  website,
  linkedIn,
  github,
}: {
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedIn?: string;
  github?: string;
}) {
  const items: ContactItemProps[] = [];

  if (email) items.push({ value: email, href: `mailto:${email}` });
  if (phone) items.push({ value: phone, href: `tel:${phone}` });
  if (location) items.push({ value: location });
  if (website) {
    const display = website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    items.push({ value: display, href: website.startsWith('http') ? website : `https://${website}` });
  }
  if (linkedIn) {
    const display = linkedIn.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
    items.push({
      value: `linkedin.com/in/${display}`,
      href: `https://linkedin.com/in/${display}`,
    });
  }
  if (github) {
    const display = github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '').replace(/\/$/, '');
    items.push({
      value: `github.com/${display}`,
      href: `https://github.com/${display}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px 0',
        fontSize: '13px',
        color: '#52525b',
        lineHeight: '1.4',
      }}
    >
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && (
            <span
              style={{
                margin: '0 8px',
                color: '#d4d4d8',
                fontSize: '10px',
                userSelect: 'none',
              }}
            >
              |
            </span>
          )}
          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {item.value}
            </a>
          ) : (
            <span>{item.value}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// =============================================================================
// Section Renderers
// =============================================================================

function SummarySection({
  entry,
}: {
  entry: SummaryEntry;
}) {
  if (isEmptyHTML(entry.content)) return null;

  return (
    <div
      className="template-content"
      style={{ fontSize: '13px', color: '#3f3f46', lineHeight: '1.55' }}
      dangerouslySetInnerHTML={{ __html: entry.content }}
    />
  );
}

function ExperienceSection({
  entry,
  accentColor,
}: {
  entry: ExperienceEntry;
  accentColor: string;
}) {
  const dateRange = formatDateRange(entry.startDate, entry.endDate);
  const hasTitle = entry.jobTitle.trim() !== '';
  const hasCompany = entry.company.trim() !== '';

  if (!hasTitle && !hasCompany && isEmptyHTML(entry.description)) {
    return null;
  }

  return (
    <div data-resume-entry style={{ marginBottom: '10px' }}>
      {/* Title + Date Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {hasTitle && (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#18181b',
                lineHeight: '1.35',
              }}
            >
              {entry.jobTitle}
            </div>
          )}
        </div>
        {dateRange && (
          <div
            style={{
              fontSize: '13px',
              color: '#71717a',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {dateRange}
          </div>
        )}
      </div>

      {/* Company + Location */}
      {(hasCompany || entry.location) && (
        <div
          style={{
            fontSize: '13.5px',
            color: '#52525b',
            lineHeight: '1.35',
            marginTop: '1px',
          }}
        >
          {hasCompany && <span>{entry.company}</span>}
          {hasCompany && entry.location && (
            <span style={{ color: '#a1a1aa', margin: '0 6px' }}>|</span>
          )}
          {entry.location && (
            <span style={{ color: '#71717a' }}>{entry.location}</span>
          )}
        </div>
      )}

      {/* Description */}
      {!isEmptyHTML(entry.description) && (
        <div
          className="template-content"
          style={{
            fontSize: '13px',
            color: '#3f3f46',
            lineHeight: '1.55',
            marginTop: '4px',
          }}
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />
      )}
    </div>
  );
}

function EducationSection({
  entry,
  accentColor,
}: {
  entry: EducationEntry;
  accentColor: string;
}) {
  const dateRange = formatDateRange(entry.startDate, entry.endDate);
  const hasInstitution = entry.institution.trim() !== '';
  const hasDegree = entry.degree.trim() !== '';

  // Build the degree line: "Bachelor of Science in Computer Science"
  let degreeLine = '';
  if (hasDegree) {
    degreeLine = entry.degree;
    if (entry.field && entry.field.trim() !== '') {
      degreeLine += ` in ${entry.field}`;
    }
  }

  if (!hasInstitution && !hasDegree && isEmptyHTML(entry.description)) {
    return null;
  }

  return (
    <div data-resume-entry style={{ marginBottom: '10px' }}>
      {/* Degree + Date Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {degreeLine && (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#18181b',
                lineHeight: '1.35',
              }}
            >
              {degreeLine}
            </div>
          )}
        </div>
        {dateRange && (
          <div
            style={{
              fontSize: '13px',
              color: '#71717a',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {dateRange}
          </div>
        )}
      </div>

      {/* Institution */}
      {hasInstitution && (
        <div
          style={{
            fontSize: '13.5px',
            color: '#52525b',
            lineHeight: '1.35',
            marginTop: '1px',
          }}
        >
          {entry.institution}
        </div>
      )}

      {/* Description */}
      {!isEmptyHTML(entry.description) && (
        <div
          className="template-content"
          style={{
            fontSize: '13px',
            color: '#3f3f46',
            lineHeight: '1.55',
            marginTop: '4px',
          }}
          dangerouslySetInnerHTML={{ __html: entry.description! }}
        />
      )}
    </div>
  );
}

function SkillsSection({ entry }: { entry: SkillsEntry }) {
  if (!entry.categories || entry.categories.length === 0) return null;

  const nonEmpty = entry.categories.filter(
    (cat) => cat.name.trim() !== '' || cat.skills.length > 0
  );
  if (nonEmpty.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {nonEmpty.map((category) => (
        <div key={category.id} style={{ fontSize: '13px', lineHeight: '1.55' }}>
          {category.name.trim() !== '' && (
            <span style={{ fontWeight: 600, color: '#27272a' }}>
              {category.name}:{' '}
            </span>
          )}
          <span style={{ color: '#3f3f46' }}>
            {category.skills.filter((s) => s.trim() !== '').join(', ')}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomSection({ entry }: { entry: CustomEntry }) {
  const hasTitle = entry.title && entry.title.trim() !== '';
  const hasSubtitle = entry.subtitle && entry.subtitle.trim() !== '';
  const dateRange = formatDateRange(entry.startDate || '', entry.endDate);
  const hasDescription = !isEmptyHTML(entry.description);

  if (!hasTitle && !hasSubtitle && !hasDescription) return null;

  return (
    <div data-resume-entry style={{ marginBottom: '10px' }}>
      {/* Title + Date Row */}
      {(hasTitle || dateRange) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {hasTitle && (
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#18181b',
                  lineHeight: '1.35',
                }}
              >
                {entry.title}
              </div>
            )}
          </div>
          {dateRange && (
            <div
              style={{
                fontSize: '13px',
                color: '#71717a',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {dateRange}
            </div>
          )}
        </div>
      )}

      {/* Subtitle */}
      {hasSubtitle && (
        <div
          style={{
            fontSize: '13.5px',
            color: '#52525b',
            lineHeight: '1.35',
            marginTop: '1px',
          }}
        >
          {entry.subtitle}
        </div>
      )}

      {/* Description */}
      {hasDescription && (
        <div
          className="template-content"
          style={{
            fontSize: '13px',
            color: '#3f3f46',
            lineHeight: '1.55',
            marginTop: '4px',
          }}
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Section Wrapper
// =============================================================================

function TemplateSection({
  section,
  accentColor,
}: {
  section: ResumeSection;
  accentColor: string;
}) {
  return (
    <div data-resume-section style={{ marginBottom: '16px' }}>
      {/* Section Header */}
      <div
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          paddingBottom: '4px',
          borderBottom: `1.5px solid ${accentColor}`,
          marginBottom: '10px',
        }}
      >
        {section.title}
      </div>

      {/* Section Entries */}
      {section.entries.map((entry) => (
        <SectionEntryRenderer
          key={entry.id}
          entry={entry}
          sectionType={section.type}
          accentColor={accentColor}
        />
      ))}
    </div>
  );
}

function SectionEntryRenderer({
  entry,
  sectionType,
  accentColor,
}: {
  entry: SectionEntry;
  sectionType: string;
  accentColor: string;
}) {
  switch (entry.type) {
    case 'summary':
      return <SummarySection entry={entry} />;
    case 'experience':
      return <ExperienceSection entry={entry} accentColor={accentColor} />;
    case 'education':
      return <EducationSection entry={entry} accentColor={accentColor} />;
    case 'skills':
      return <SkillsSection entry={entry} />;
    case 'custom':
      return <CustomSection entry={entry} />;
    default:
      return null;
  }
}

// =============================================================================
// ClassicTemplate (Main Export)
// =============================================================================

export function ClassicTemplate({ data, accentColor }: TemplateProps) {
  const accent = accentColor || DEFAULT_ACCENT;
  const { personalInfo, sections } = data;

  const fullName = buildFullName(data);
  const visibleSections = getVisibleSections(sections);

  return (
    <div
      style={{
        width: '816px', // 8.5in at 96dpi
        minHeight: '1056px', // 11in at 96dpi
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
        color: '#18181b',
        padding: '48px 56px',
        boxSizing: 'border-box',
        lineHeight: '1.4',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      {fullName && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: '4px',
          }}
        >
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: accent,
              margin: 0,
              letterSpacing: '-0.3px',
              lineHeight: '1.2',
            }}
          >
            {fullName}
          </h1>
        </div>
      )}

      {/* ── Contact Info ────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <ContactInfo
          email={personalInfo.email}
          phone={personalInfo.phone}
          location={personalInfo.location}
          website={personalInfo.website}
          linkedIn={personalInfo.linkedIn}
          github={personalInfo.github}
        />
      </div>

      {/* ── Sections ────────────────────────────────────────────── */}
      {visibleSections.map((section) => (
        <TemplateSection
          key={section.id}
          section={section}
          accentColor={accent}
        />
      ))}
    </div>
  );
}
