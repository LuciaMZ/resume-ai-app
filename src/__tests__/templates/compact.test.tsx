import { render, screen } from '@testing-library/react';
import { CompactTemplate } from '@/components/templates/compact/CompactTemplate';
import type { ResumeData } from '@/types/resume';

// =============================================================================
// Test Fixture Helpers
// =============================================================================

function createMinimalResumeData(overrides?: Partial<ResumeData>): ResumeData {
  return {
    meta: {
      id: 'test-resume-1',
      templateId: 'compact',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
    },
    sections: [],
    ...overrides,
  };
}

function createFullResumeData(): ResumeData {
  return {
    meta: {
      id: 'test-resume-full',
      templateId: 'compact',
      accentColor: '#2563eb',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-06-15T12:00:00.000Z',
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '555-123-4567',
      location: 'San Francisco, CA',
      website: 'https://janedoe.dev',
      linkedIn: 'https://linkedin.com/in/janedoe',
      github: 'https://github.com/janedoe',
    },
    sections: [
      {
        id: 'sec-summary',
        type: 'summary',
        title: 'Professional Summary',
        visible: true,
        order: 0,
        entries: [
          {
            id: 'entry-summary-1',
            type: 'summary',
            content: '<p>Experienced software engineer with 10+ years in full-stack development.</p>',
          },
        ],
      },
      {
        id: 'sec-experience',
        type: 'experience',
        title: 'Work Experience',
        visible: true,
        order: 1,
        entries: [
          {
            id: 'entry-exp-1',
            type: 'experience',
            jobTitle: 'Senior Software Engineer',
            company: 'TechCorp',
            location: 'San Francisco, CA',
            startDate: '2020-03',
            endDate: null,
            description: '<p>Led development of microservices architecture.</p>',
          },
          {
            id: 'entry-exp-2',
            type: 'experience',
            jobTitle: 'Software Engineer',
            company: 'StartupInc',
            location: 'Remote',
            startDate: '2018-01',
            endDate: '2020-02',
            description: '<p>Built REST APIs and React frontends.</p>',
          },
        ],
      },
      {
        id: 'sec-education',
        type: 'education',
        title: 'Education',
        visible: true,
        order: 2,
        entries: [
          {
            id: 'entry-edu-1',
            type: 'education',
            institution: 'MIT',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: '2014-09',
            endDate: '2018-05',
            description: '<p>Dean\'s List, GPA 3.9</p>',
          },
        ],
      },
      {
        id: 'sec-skills',
        type: 'skills',
        title: 'Skills',
        visible: true,
        order: 3,
        entries: [
          {
            id: 'entry-skills-1',
            type: 'skills',
            categories: [
              {
                id: 'cat-1',
                name: 'Languages',
                skills: ['TypeScript', 'Python', 'Go'],
              },
              {
                id: 'cat-2',
                name: 'Frameworks',
                skills: ['React', 'Next.js', 'Django'],
              },
            ],
          },
        ],
      },
      {
        id: 'sec-custom',
        type: 'custom',
        title: 'Projects',
        visible: true,
        order: 4,
        entries: [
          {
            id: 'entry-custom-1',
            type: 'custom',
            title: 'Open Source CLI Tool',
            subtitle: 'Creator & Maintainer',
            startDate: '2022-06',
            endDate: null,
            description: '<p>A CLI tool for automating deployments.</p>',
          },
        ],
      },
      {
        id: 'sec-hidden',
        type: 'custom',
        title: 'Hidden Section',
        visible: false,
        order: 5,
        entries: [
          {
            id: 'entry-hidden-1',
            type: 'custom',
            title: 'Should Not Render',
            description: '<p>This section is hidden.</p>',
          },
        ],
      },
    ],
  };
}

// =============================================================================
// Tests: CompactTemplate
// =============================================================================

describe('CompactTemplate', () => {
  // ---------------------------------------------------------------------------
  // Basic Rendering
  // ---------------------------------------------------------------------------

  describe('basic rendering', () => {
    it('renders without crashing with valid ResumeData', () => {
      const data = createFullResumeData();
      const { container } = render(<CompactTemplate data={data} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders without crashing with empty resume data', () => {
      const data = createMinimalResumeData();
      const { container } = render(<CompactTemplate data={data} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders as a div with 816px width (US Letter)', () => {
      const data = createMinimalResumeData();
      const { container } = render(<CompactTemplate data={data} />);
      const root = container.firstChild as HTMLElement;
      expect(root.style.width).toBe('816px');
    });
  });

  // ---------------------------------------------------------------------------
  // Accent Color
  // ---------------------------------------------------------------------------

  describe('accent color', () => {
    it('defaults to #374151 when accentColor is not provided', () => {
      const data = createFullResumeData();
      const { container } = render(<CompactTemplate data={data} />);
      // The name h1 should use the default accent color
      // jsdom converts hex to rgb(), so #374151 becomes rgb(55, 65, 81)
      const nameEl = container.querySelector('h1');
      expect(nameEl).toBeTruthy();
      expect(nameEl!.style.color).toBe('rgb(55, 65, 81)');
    });

    it('applies custom accent color when provided', () => {
      const data = createFullResumeData();
      const { container } = render(
        <CompactTemplate data={data} accentColor="#e11d48" />
      );
      const nameEl = container.querySelector('h1');
      expect(nameEl).toBeTruthy();
      expect(nameEl!.style.color).toBe('rgb(225, 29, 72)');
    });

    it('applies accent color to section headers', () => {
      const data = createFullResumeData();
      const { container } = render(
        <CompactTemplate data={data} accentColor="#059669" />
      );
      // Section headers have data-resume-section parent divs
      const sectionDivs = container.querySelectorAll('[data-resume-section]');
      expect(sectionDivs.length).toBeGreaterThan(0);
      // The first child of each section div is the header
      const firstHeader = sectionDivs[0].firstChild as HTMLElement;
      expect(firstHeader.style.color).toBe('rgb(5, 150, 105)');
    });
  });

  // ---------------------------------------------------------------------------
  // Personal Info
  // ---------------------------------------------------------------------------

  describe('personal info', () => {
    it('renders the full name correctly', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('renders email in contact info', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders phone in contact info', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('555-123-4567')).toBeInTheDocument();
    });

    it('renders location in contact info', () => {
      // Use a resume with only personal info (no experience entries that share the same location text)
      const data = createMinimalResumeData({
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '555-000-0000',
          location: 'New York, NY',
        },
      });
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('New York, NY')).toBeInTheDocument();
    });

    it('does not render name when firstName and lastName are empty', () => {
      const data = createMinimalResumeData();
      const { container } = render(<CompactTemplate data={data} />);
      const h1 = container.querySelector('h1');
      expect(h1).toBeNull();
    });

    it('renders only firstName when lastName is empty', () => {
      const data = createMinimalResumeData({
        personalInfo: {
          firstName: 'John',
          lastName: '',
          email: '',
          phone: '',
          location: '',
        },
      });
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('renders website without protocol prefix', () => {
      const data = createMinimalResumeData({
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: '',
          phone: '',
          location: '',
          website: 'https://www.example.com/',
        },
      });
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('renders LinkedIn display URL', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('linkedin.com/in/janedoe')).toBeInTheDocument();
    });

    it('renders GitHub display URL', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('github.com/janedoe')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Sections Visibility
  // ---------------------------------------------------------------------------

  describe('section visibility', () => {
    it('does not render hidden sections', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.queryByText('Hidden Section')).not.toBeInTheDocument();
      expect(screen.queryByText('Should Not Render')).not.toBeInTheDocument();
    });

    it('renders visible sections', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Professional Summary')).toBeInTheDocument();
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders no section blocks when all sections are hidden', () => {
      const data = createMinimalResumeData({
        sections: [
          {
            id: 'sec-1',
            type: 'summary',
            title: 'Summary',
            visible: false,
            order: 0,
            entries: [
              { id: 'e1', type: 'summary', content: '<p>Test</p>' },
            ],
          },
        ],
      });
      const { container } = render(<CompactTemplate data={data} />);
      const sectionDivs = container.querySelectorAll('[data-resume-section]');
      expect(sectionDivs.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Summary Section
  // ---------------------------------------------------------------------------

  describe('summary section', () => {
    it('renders summary content', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(
        screen.getByText(/Experienced software engineer with 10\+ years/)
      ).toBeInTheDocument();
    });

    it('does not render summary entry when content is empty', () => {
      const data = createMinimalResumeData({
        sections: [
          {
            id: 'sec-summary',
            type: 'summary',
            title: 'Summary',
            visible: true,
            order: 0,
            entries: [
              { id: 'e1', type: 'summary', content: '<p></p>' },
            ],
          },
        ],
      });
      const { container } = render(<CompactTemplate data={data} />);
      // The section header renders but the entry content should not
      const templateContent = container.querySelectorAll('.template-content');
      expect(templateContent.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Experience Section
  // ---------------------------------------------------------------------------

  describe('experience section', () => {
    it('renders job title', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('renders company name', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText('StartupInc')).toBeInTheDocument();
    });

    it('renders date ranges', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      // endDate null => "Present"
      expect(screen.getByText('Mar 2020 - Present')).toBeInTheDocument();
      expect(screen.getByText('Jan 2018 - Feb 2020')).toBeInTheDocument();
    });

    it('renders experience description', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(
        screen.getByText('Led development of microservices architecture.')
      ).toBeInTheDocument();
    });

    it('renders experience location', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      // Location appears as text alongside company
      expect(screen.getByText('Remote')).toBeInTheDocument();
    });

    it('does not render empty experience entry', () => {
      const data = createMinimalResumeData({
        sections: [
          {
            id: 'sec-exp',
            type: 'experience',
            title: 'Experience',
            visible: true,
            order: 0,
            entries: [
              {
                id: 'e1',
                type: 'experience',
                jobTitle: '',
                company: '',
                startDate: '',
                endDate: '',
                description: '',
              },
            ],
          },
        ],
      });
      const { container } = render(<CompactTemplate data={data} />);
      const entryDivs = container.querySelectorAll('[data-resume-entry]');
      expect(entryDivs.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Education Section
  // ---------------------------------------------------------------------------

  describe('education section', () => {
    it('renders degree with field of study', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(
        screen.getByText('Bachelor of Science in Computer Science')
      ).toBeInTheDocument();
    });

    it('renders institution', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('MIT')).toBeInTheDocument();
    });

    it('renders education date range', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Sep 2014 - May 2018')).toBeInTheDocument();
    });

    it('renders education description', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText("Dean's List, GPA 3.9")).toBeInTheDocument();
    });

    it('renders degree without field when field is empty', () => {
      const data = createMinimalResumeData({
        sections: [
          {
            id: 'sec-edu',
            type: 'education',
            title: 'Education',
            visible: true,
            order: 0,
            entries: [
              {
                id: 'e1',
                type: 'education',
                institution: 'Stanford',
                degree: 'Master of Arts',
                field: '',
                startDate: '2020-09',
                endDate: '2022-06',
              },
            ],
          },
        ],
      });
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Master of Arts')).toBeInTheDocument();
      expect(screen.queryByText(/Master of Arts in/)).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Skills Section
  // ---------------------------------------------------------------------------

  describe('skills section', () => {
    it('renders skill categories', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      // Category names are rendered with a colon
      expect(screen.getByText(/Languages:/)).toBeInTheDocument();
      expect(screen.getByText(/Frameworks:/)).toBeInTheDocument();
    });

    it('renders individual skills as comma-separated list', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('TypeScript, Python, Go')).toBeInTheDocument();
      expect(screen.getByText('React, Next.js, Django')).toBeInTheDocument();
    });

    it('uses multi-column layout (columnCount: 2)', () => {
      const data = createMinimalResumeData({
        sections: [
          {
            id: 'sec-skills',
            type: 'skills',
            title: 'Skills',
            visible: true,
            order: 0,
            entries: [
              {
                id: 'e1',
                type: 'skills',
                categories: [
                  { id: 'c1', name: 'Languages', skills: ['JS'] },
                ],
              },
            ],
          },
        ],
      });
      const { container } = render(<CompactTemplate data={data} />);
      // Find the skills container with columnCount style
      const sectionDivs = container.querySelectorAll('[data-resume-section]');
      expect(sectionDivs.length).toBe(1);
      // The skills content wrapper should have column-count
      const skillsContainer = sectionDivs[0].querySelector('[style*="column-count"]') as HTMLElement;
      expect(skillsContainer).toBeTruthy();
      expect(skillsContainer!.style.columnCount).toBe('2');
    });

    it('does not render skills section when categories are empty', () => {
      const data = createMinimalResumeData({
        sections: [
          {
            id: 'sec-skills',
            type: 'skills',
            title: 'Skills',
            visible: true,
            order: 0,
            entries: [
              {
                id: 'e1',
                type: 'skills',
                categories: [],
              },
            ],
          },
        ],
      });
      const { container } = render(<CompactTemplate data={data} />);
      // Section header will render, but the skills content should not
      const columnContainers = container.querySelectorAll('[style*="column-count"]');
      expect(columnContainers.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Custom Section
  // ---------------------------------------------------------------------------

  describe('custom section', () => {
    it('renders custom entry title', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Open Source CLI Tool')).toBeInTheDocument();
    });

    it('renders custom entry subtitle', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Creator & Maintainer')).toBeInTheDocument();
    });

    it('renders custom entry date range', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(screen.getByText('Jun 2022 - Present')).toBeInTheDocument();
    });

    it('renders custom entry description', () => {
      const data = createFullResumeData();
      render(<CompactTemplate data={data} />);
      expect(
        screen.getByText('A CLI tool for automating deployments.')
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Section Headers
  // ---------------------------------------------------------------------------

  describe('section headers', () => {
    it('renders section titles in uppercase', () => {
      const data = createFullResumeData();
      const { container } = render(<CompactTemplate data={data} />);
      const sectionDivs = container.querySelectorAll('[data-resume-section]');
      sectionDivs.forEach((section) => {
        const header = section.firstChild as HTMLElement;
        expect(header.style.textTransform).toBe('uppercase');
      });
    });

    it('renders section headers with accent-colored bottom border', () => {
      const data = createFullResumeData();
      const { container } = render(
        <CompactTemplate data={data} accentColor="#dc2626" />
      );
      const sectionDivs = container.querySelectorAll('[data-resume-section]');
      expect(sectionDivs.length).toBeGreaterThan(0);
      const header = sectionDivs[0].firstChild as HTMLElement;
      // jsdom converts hex to rgb in border shorthand
      expect(header.style.borderBottom).toContain('rgb(220, 38, 38)');
    });
  });
});
