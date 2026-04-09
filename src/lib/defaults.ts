// =============================================================================
// Default Resume Data
// =============================================================================
// Creates a fresh ResumeData object with 4 pre-configured sections and
// realistic placeholder content that guides users on what to fill in.
// =============================================================================

import type { ResumeData } from '@/types/resume';
import { generateId } from './uuid';

/**
 * Create a new default ResumeData with placeholder content.
 * Every call generates fresh UUIDs so each instance is unique.
 */
export function createDefaultResumeData(): ResumeData {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateId(),
      templateId: 'classic',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedIn: '',
      github: '',
    },
    sections: [
      // ── Summary ──────────────────────────────────────────────
      {
        id: generateId(),
        type: 'summary',
        title: 'Professional Summary',
        visible: true,
        order: 0,
        entries: [
          {
            id: generateId(),
            type: 'summary',
            content:
              '<p>Results-driven professional with a strong background in delivering impactful solutions. Skilled at collaborating across teams to drive projects from concept to completion. Replace this text with your own professional summary highlighting your key strengths and career objectives.</p>',
          },
        ],
      },

      // ── Experience ───────────────────────────────────────────
      {
        id: generateId(),
        type: 'experience',
        title: 'Work Experience',
        visible: true,
        order: 1,
        entries: [
          {
            id: generateId(),
            type: 'experience',
            jobTitle: 'Senior Software Engineer',
            company: 'Acme Technologies',
            location: 'San Francisco, CA',
            startDate: '2021-06',
            endDate: null,
            description:
              '<ul><li>Led the development of a customer-facing dashboard that increased user engagement by 35%</li><li>Architected and implemented a microservices migration, reducing deployment times by 60%</li><li>Mentored a team of 4 junior engineers through code reviews and pair programming sessions</li></ul>',
          },
        ],
      },

      // ── Education ────────────────────────────────────────────
      {
        id: generateId(),
        type: 'education',
        title: 'Education',
        visible: true,
        order: 2,
        entries: [
          {
            id: generateId(),
            type: 'education',
            institution: 'University of California, Berkeley',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: '2015-08',
            endDate: '2019-05',
            description:
              '<p>Relevant coursework: Data Structures, Algorithms, Distributed Systems, Machine Learning</p>',
          },
        ],
      },

      // ── Skills ───────────────────────────────────────────────
      {
        id: generateId(),
        type: 'skills',
        title: 'Skills',
        visible: true,
        order: 3,
        entries: [
          {
            id: generateId(),
            type: 'skills',
            categories: [
              {
                id: generateId(),
                name: 'Technical',
                skills: [
                  'TypeScript',
                  'React',
                  'Next.js',
                  'Node.js',
                  'Python',
                  'PostgreSQL',
                ],
              },
              {
                id: generateId(),
                name: 'Soft Skills',
                skills: [
                  'Team Leadership',
                  'Technical Writing',
                  'Agile Methodologies',
                  'Cross-functional Collaboration',
                ],
              },
              {
                id: generateId(),
                name: 'Tools & Platforms',
                skills: [
                  'Git',
                  'Docker',
                  'AWS',
                  'Figma',
                  'Jira',
                  'CI/CD',
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
