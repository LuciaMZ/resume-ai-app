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

const DEFAULT_ACCENT = '#1e3a5f';
const SERIF_FONT = 'Georgia, "Times New Roman", "Palatino Linotype", serif';

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
        gap: '2px 0',
        fontSize: '12px',
        fontFamily: SERIF_FONT,
        color: '#3f3f46',
        lineHeight: '1.4',
      }}
    >
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && (
            <span
              style={{
                margin: '0 8px',
                color: '#a1a1aa',
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

function SummarySection({ entry }: { entry: SummaryEntry }) {
  if (isEmptyHTML(entry.content)) return null;

  return (
    <div
      className="template-content"
      style={{
        fontSize: '12.5px',
        fontFamily: SERIF_FONT,
        color: '#27272a',
        lineHeight: '1.5',
      }}
      dangerouslySetInnerHTML={{ __html: entry.content }}
    />
  );
}

function ExperienceSection({
  entry,
}: {
  entry: ExperienceEntry;
}) {
  const dateRange = formatDateRange(entry.startDate, entry.endDate);
  const hasTitle = entry.jobTitle.trim() !== '';
  const hasCompany = entry.company.trim() !== '';

  if (!hasTitle && !hasCompany && isEmptyHTML(entry.description)) {
    return null;
  }

  return (
    <div data-resume-entry style={{ marginBottom: '8px' }}>
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
                fontSize: '13px',
                fontFamily: SERIF_FONT,
                fontWeight: 700,
                color: '#18181b',
                lineHeight: '1.3',
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
              fontFamily: SERIF_FONT,
              color: '#52525b',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {dateRange}
          </div>
        )}
      </div>

      {/* Company + Location — italic for academic style */}
      {(hasCompany || entry.location) && (
        <div
          style={{
            fontSize: '12.5px',
            fontFamily: SERIF_FONT,
            fontStyle: 'italic',
            color: '#3f3f46',
            lineHeight: '1.3',
            marginTop: '1px',
          }}
        >
          {hasCompany && <span>{entry.company}</span>}
          {hasCompany && entry.location && (
            <span style={{ fontStyle: 'normal', color: '#a1a1aa', margin: '0 5px' }}>,</span>
          )}
          {entry.location && (
            <span>{entry.location}</span>
          )}
        </div>
      )}

      {/* Description */}
      {!isEmptyHTML(entry.description) && (
        <div
          className="template-content"
          style={{
            fontSize: '12.5px',
            fontFamily: SERIF_FONT,
            color: '#27272a',
            lineHeight: '1.45',
            marginTop: '3px',
          }}
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />
      )}
    </div>
  );
}

function EducationSection({
  entry,
}: {
  entry: EducationEntry;
}) {
  const dateRange = formatDateRange(entry.startDate, entry.endDate);
  const hasInstitution = entry.institution.trim() !== '';
  const hasDegree = entry.degree.trim() !== '';

  // Build degree line: "Ph.D. in Computer Science"
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
    <div style={{ marginBottom: '8px' }}>
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
                fontSize: '13px',
                fontFamily: SERIF_FONT,
                fontWeight: 700,
                color: '#18181b',
                lineHeight: '1.3',
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
              fontFamily: SERIF_FONT,
              color: '#52525b',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {dateRange}
          </div>
        )}
      </div>

      {/* Institution — italic */}
      {hasInstitution && (
        <div
          style={{
            fontSize: '12.5px',
            fontFamily: SERIF_FONT,
            fontStyle: 'italic',
            color: '#3f3f46',
            lineHeight: '1.3',
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
            fontSize: '12.5px',
            fontFamily: SERIF_FONT,
            color: '#27272a',
            lineHeight: '1.45',
            marginTop: '3px',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {nonEmpty.map((category) => (
        <div
          key={category.id}
          style={{
            fontSize: '12.5px',
            fontFamily: SERIF_FONT,
            lineHeight: '1.45',
          }}
        >
          {category.name.trim() !== '' && (
            <span style={{ fontWeight: 700, color: '#18181b' }}>
              {category.name}:{' '}
            </span>
          )}
          <span style={{ color: '#27272a' }}>
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
    <div data-resume-entry style={{ marginBottom: '8px' }}>
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
                  fontSize: '13px',
                  fontFamily: SERIF_FONT,
                  fontWeight: 700,
                  color: '#18181b',
                  lineHeight: '1.3',
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
                fontFamily: SERIF_FONT,
                color: '#52525b',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {dateRange}
            </div>
          )}
        </div>
      )}

      {/* Subtitle — italic */}
      {hasSubtitle && (
        <div
          style={{
            fontSize: '12.5px',
            fontFamily: SERIF_FONT,
            fontStyle: 'italic',
            color: '#3f3f46',
            lineHeight: '1.3',
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
            fontSize: '12.5px',
            fontFamily: SERIF_FONT,
            color: '#27272a',
            lineHeight: '1.45',
            marginTop: '3px',
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
    <div data-resume-section style={{ marginBottom: '12px' }}>
      {/* Section Header — academic minimalism: accent text, thin gray rule */}
      <div
        style={{
          fontSize: '13px',
          fontFamily: SERIF_FONT,
          fontWeight: 700,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          paddingBottom: '3px',
          borderBottom: '1px solid #d4d4d8',
          marginBottom: '8px',
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
}: {
  entry: SectionEntry;
  sectionType: string;
  accentColor: string;
}) {
  switch (entry.type) {
    case 'summary':
      return <SummarySection entry={entry} />;
    case 'experience':
      return <ExperienceSection entry={entry} />;
    case 'education':
      return <EducationSection entry={entry} />;
    case 'skills':
      return <SkillsSection entry={entry} />;
    case 'custom':
      return <CustomSection entry={entry} />;
    default:
      return null;
  }
}

// =============================================================================
// AcademicTemplate (Main Export)
// =============================================================================

export function AcademicTemplate({ data, accentColor }: TemplateProps) {
  const accent = accentColor || DEFAULT_ACCENT;
  const { personalInfo, sections } = data;

  const fullName = buildFullName(data);
  const visibleSections = getVisibleSections(sections);

  return (
    <div
      style={{
        width: '816px',
        minHeight: '1056px',
        backgroundColor: '#ffffff',
        fontFamily: SERIF_FONT,
        color: '#18181b',
        padding: '40px 52px',
        boxSizing: 'border-box',
        lineHeight: '1.4',
      }}
    >
      {/* -- Header ---------------------------------------------------- */}
      {fullName && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: '6px',
          }}
        >
          <h1
            style={{
              fontSize: '22px',
              fontFamily: SERIF_FONT,
              fontWeight: 700,
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: '2.5px',
              margin: 0,
              lineHeight: '1.2',
            }}
          >
            {fullName}
          </h1>

          {/* Thin horizontal rule below name */}
          <div
            style={{
              width: '100%',
              height: '1px',
              backgroundColor: accent,
              marginTop: '8px',
            }}
          />
        </div>
      )}

      {/* -- Contact Info ---------------------------------------------- */}
      <div style={{ marginBottom: '16px', marginTop: '6px' }}>
        <ContactInfo
          email={personalInfo.email}
          phone={personalInfo.phone}
          location={personalInfo.location}
          website={personalInfo.website}
          linkedIn={personalInfo.linkedIn}
          github={personalInfo.github}
        />
      </div>

      {/* -- Sections -------------------------------------------------- */}
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
