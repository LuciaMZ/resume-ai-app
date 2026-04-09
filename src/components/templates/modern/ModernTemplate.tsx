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

const DEFAULT_ACCENT = '#0f766e';
const SIDEBAR_WIDTH = 260;
const PAGE_WIDTH = 816;
const PAGE_MIN_HEIGHT = 1056;

// =============================================================================
// Sidebar: Contact Info
// =============================================================================

function SidebarContactInfo({
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
  const items: { label: string; value: string; href?: string }[] = [];

  if (email) items.push({ label: 'Email', value: email, href: `mailto:${email}` });
  if (phone) items.push({ label: 'Phone', value: phone, href: `tel:${phone}` });
  if (location) items.push({ label: 'Location', value: location });
  if (website) {
    const display = website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    items.push({
      label: 'Website',
      value: display,
      href: website.startsWith('http') ? website : `https://${website}`,
    });
  }
  if (linkedIn) {
    const display = linkedIn
      .replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')
      .replace(/\/$/, '');
    items.push({
      label: 'LinkedIn',
      value: display,
      href: `https://linkedin.com/in/${display}`,
    });
  }
  if (github) {
    const display = github
      .replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')
      .replace(/\/$/, '');
    items.push({
      label: 'GitHub',
      value: display,
      href: `https://github.com/${display}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ lineHeight: '1.3' }}>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '2px',
            }}
          >
            {item.label}
          </div>
          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.95)',
                textDecoration: 'none',
                wordBreak: 'break-all',
              }}
            >
              {item.value}
            </a>
          ) : (
            <div
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.95)',
                wordBreak: 'break-all',
              }}
            >
              {item.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Sidebar: Skills Section
// =============================================================================

function SidebarSkillsSection({
  section,
}: {
  section: ResumeSection;
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Section Header */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          color: '#ffffff',
          paddingBottom: '6px',
          borderBottom: '1.5px solid rgba(255, 255, 255, 0.3)',
          marginBottom: '10px',
        }}
      >
        {section.title}
      </div>

      {/* Skills Entries */}
      {section.entries.map((entry) => {
        if (entry.type !== 'skills') return null;
        return <SidebarSkillsEntry key={entry.id} entry={entry} />;
      })}
    </div>
  );
}

function SidebarSkillsEntry({ entry }: { entry: SkillsEntry }) {
  if (!entry.categories || entry.categories.length === 0) return null;

  const nonEmpty = entry.categories.filter(
    (cat) => cat.name.trim() !== '' || cat.skills.length > 0
  );
  if (nonEmpty.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {nonEmpty.map((category) => (
        <div key={category.id} style={{ lineHeight: '1.45' }}>
          {category.name.trim() !== '' && (
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.95)',
                marginBottom: '2px',
              }}
            >
              {category.name}
            </div>
          )}
          <div
            style={{
              fontSize: '11.5px',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            {category.skills.filter((s) => s.trim() !== '').join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Area: Section Renderers
// =============================================================================

function MainSummarySection({ entry }: { entry: SummaryEntry }) {
  if (isEmptyHTML(entry.content)) return null;

  return (
    <div
      className="template-content"
      style={{ fontSize: '13px', color: '#3f3f46', lineHeight: '1.6' }}
      dangerouslySetInnerHTML={{ __html: entry.content }}
    />
  );
}

function MainExperienceSection({
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
    <div data-resume-entry style={{ marginBottom: '12px' }}>
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
              fontSize: '12px',
              color: accentColor,
              fontWeight: 500,
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
            fontSize: '13px',
            color: '#52525b',
            lineHeight: '1.35',
            marginTop: '1px',
          }}
        >
          {hasCompany && <span style={{ fontStyle: 'italic' }}>{entry.company}</span>}
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
            lineHeight: '1.6',
            marginTop: '5px',
          }}
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />
      )}
    </div>
  );
}

function MainEducationSection({
  entry,
  accentColor,
}: {
  entry: EducationEntry;
  accentColor: string;
}) {
  const dateRange = formatDateRange(entry.startDate, entry.endDate);
  const hasInstitution = entry.institution.trim() !== '';
  const hasDegree = entry.degree.trim() !== '';

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
    <div style={{ marginBottom: '12px' }}>
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
              fontSize: '12px',
              color: accentColor,
              fontWeight: 500,
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
            fontSize: '13px',
            color: '#52525b',
            fontStyle: 'italic',
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
            lineHeight: '1.6',
            marginTop: '5px',
          }}
          dangerouslySetInnerHTML={{ __html: entry.description! }}
        />
      )}
    </div>
  );
}

function MainCustomSection({ entry }: { entry: CustomEntry; accentColor: string }) {
  const hasTitle = entry.title && entry.title.trim() !== '';
  const hasSubtitle = entry.subtitle && entry.subtitle.trim() !== '';
  const dateRange = formatDateRange(entry.startDate || '', entry.endDate);
  const hasDescription = !isEmptyHTML(entry.description);

  if (!hasTitle && !hasSubtitle && !hasDescription) return null;

  return (
    <div data-resume-entry style={{ marginBottom: '12px' }}>
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
                fontSize: '12px',
                color: '#71717a',
                fontWeight: 500,
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
            fontSize: '13px',
            color: '#52525b',
            fontStyle: 'italic',
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
            lineHeight: '1.6',
            marginTop: '5px',
          }}
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Main Area: Section Entry Router
// =============================================================================

function MainSectionEntryRenderer({
  entry,
  accentColor,
}: {
  entry: SectionEntry;
  accentColor: string;
}) {
  switch (entry.type) {
    case 'summary':
      return <MainSummarySection entry={entry} />;
    case 'experience':
      return <MainExperienceSection entry={entry} accentColor={accentColor} />;
    case 'education':
      return <MainEducationSection entry={entry} accentColor={accentColor} />;
    case 'custom':
      return <MainCustomSection entry={entry} accentColor={accentColor} />;
    default:
      return null;
  }
}

// =============================================================================
// Main Area: Section Wrapper
// =============================================================================

function MainSection({
  section,
  accentColor,
}: {
  section: ResumeSection;
  accentColor: string;
}) {
  return (
    <div data-resume-section style={{ marginBottom: '18px' }}>
      {/* Section Header */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          paddingBottom: '5px',
          borderBottom: `2px solid ${accentColor}`,
          marginBottom: '10px',
        }}
      >
        {section.title}
      </div>

      {/* Section Entries */}
      {section.entries.map((entry) => (
        <MainSectionEntryRenderer
          key={entry.id}
          entry={entry}
          accentColor={accentColor}
        />
      ))}
    </div>
  );
}

// =============================================================================
// ModernTemplate (Main Export)
// =============================================================================

export function ModernTemplate({ data, accentColor }: TemplateProps) {
  const accent = accentColor || DEFAULT_ACCENT;
  const { personalInfo, sections } = data;

  const fullName = buildFullName(data);
  const visibleSections = getVisibleSections(sections);
  const sidebarSections = visibleSections.filter((s) => s.type === 'skills');
  const mainSections = visibleSections.filter((s) => s.type !== 'skills');

  return (
    <div
      style={{
        width: `${PAGE_WIDTH}px`,
        minHeight: `${PAGE_MIN_HEIGHT}px`,
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
        color: '#18181b',
        display: 'flex',
        boxSizing: 'border-box',
        lineHeight: '1.4',
        overflow: 'hidden',
      }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          minWidth: `${SIDEBAR_WIDTH}px`,
          minHeight: `${PAGE_MIN_HEIGHT}px`,
          alignSelf: 'flex-start',
          backgroundColor: accent,
          color: '#ffffff',
          padding: '28px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Name */}
        {fullName && (
          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                lineHeight: '1.25',
                letterSpacing: '-0.2px',
                wordBreak: 'break-word',
              }}
            >
              {fullName}
            </h1>
          </div>
        )}

        {/* Contact Info */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: '#ffffff',
              paddingBottom: '6px',
              borderBottom: '1.5px solid rgba(255, 255, 255, 0.3)',
              marginBottom: '10px',
            }}
          >
            Contact
          </div>
          <SidebarContactInfo
            email={personalInfo.email}
            phone={personalInfo.phone}
            location={personalInfo.location}
            website={personalInfo.website}
            linkedIn={personalInfo.linkedIn}
            github={personalInfo.github}
          />
        </div>

        {/* Skills Sections */}
        {sidebarSections.map((section) => (
          <SidebarSkillsSection key={section.id} section={section} />
        ))}
      </div>

      {/* ── Main Area ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: '32px 36px',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        {mainSections.map((section) => (
          <MainSection
            key={section.id}
            section={section}
            accentColor={accent}
          />
        ))}
      </div>
    </div>
  );
}
