/**
 * Tool definitions for the OpenAI Responses API
 */
export const AI_TOOLS = [
  {
    type: 'function',
    name: 'update_resume',
    description:
      "Updates the user's resume by applying the specified changes to resume fields.",
    parameters: {
      type: 'object',
      properties: {
        proposal: {
          type: 'object',
          description:
            'A JSON object containing the resume fields to update. Use deep merge semantics - only include the fields you want to change. Available top-level keys: contact, summary, skills, projects, experiences, education, certifications, languages.',
          properties: {
            contact: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                location: { type: 'string' },
                headline: { type: 'string' },
                linkedinUrl: { type: 'string' },
                githubUrl: { type: 'string' },
                websiteUrl: { type: 'string' },
              },
            },
            summary: {
              type: 'string',
              description: 'Professional summary text',
            },
            skills: {
              type: 'array',
              description:
                'Array of skill objects. To add a skill, include the full array with the new skill added.',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  level: {
                    type: 'string',
                    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
                  },
                  category: { type: 'string' },
                },
              },
            },
            education: {
              type: 'array',
              description:
                'Array of education entries. To add education, include the full array with the new entry added.',
              items: {
                type: 'object',
                properties: {
                  school: { type: 'string' },
                  degree: { type: 'string' },
                  field: { type: 'string' },
                  location: { type: 'string' },
                  startDate: { type: 'string', description: 'YYYY-MM' },
                  endDate: { type: 'string', description: 'YYYY-MM' },
                  grade: { type: 'string' },
                  notes: {
                    type: 'string',
                    description: 'Relevant coursework, honors, etc.',
                  },
                  isCurrent: { type: 'boolean' },
                },
              },
            },
          },
          additionalProperties: true,
        },
        explanation: {
          type: 'string',
          description:
            'A brief 1-sentence explanation of what changes you are making and why.',
        },
      },
      required: ['proposal', 'explanation'],
    },
  },
] as const;
