import { describe, it, expect } from 'vitest';
import { cleanResumeContext } from './ai-context';
import { BaseResumeData } from 'shared';

describe('cleanResumeContext', () => {
    it('should remove IDs from skills', () => {
        const input: BaseResumeData = {
            version: 1,
            contact: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                headline: null,
                phone: null,
                location: null,
                websiteUrl: null,
                linkedinUrl: null,
                githubUrl: null,
            },
            skills: [
                { id: '1', name: 'React', category: 'Frontend', level: 'ADVANCED' },
                { id: '2', name: 'Node', category: 'Backend', level: 'INTERMEDIATE' },
            ],
            experiences: [],
            projects: [],
            education: null,
            certifications: null,
            languages: null,
            summary: null,
        };

        const result = cleanResumeContext(input);

        expect(result.skills).toHaveLength(2);
        expect((result.skills![0] as any).id).toBeUndefined();
        expect(result.skills![0].name).toBe('React');
    });

    it('should remove IDs from experiences and bullets', () => {
        const input: BaseResumeData = {
            version: 1,
            contact: { firstName: 'John', lastName: 'Doe', email: 'j@d.com', headline: null, phone: null, location: null, websiteUrl: null, linkedinUrl: null, githubUrl: null },
            skills: [],
            experiences: [
                {
                    id: 'exp1',
                    company: 'Acme',
                    title: 'Dev',
                    startDate: '2020-01',
                    endDate: null,
                    isCurrent: true,
                    location: null,
                    tech: null,
                    bullets: [
                        { id: 'b1', text: 'Did stuff' },
                    ]
                }
            ],
            projects: [],
            education: null,
            certifications: null,
            languages: null,
            summary: null,
        };

        const result = cleanResumeContext(input);

        expect((result.experiences![0] as any).id).toBeUndefined();
        expect((result.experiences![0].bullets![0] as any).id).toBeUndefined();
        expect(result.experiences![0].company).toBe('Acme');
        expect(result.experiences![0].bullets![0].text).toBe('Did stuff');
    });

    it('should remove version field', () => {
        const input: BaseResumeData = {
            version: 1,
            contact: { firstName: 'John', lastName: 'Doe', email: 'j@d.com', headline: null, phone: null, location: null, websiteUrl: null, linkedinUrl: null, githubUrl: null },
            skills: [],
            experiences: [],
            projects: [],
            education: null,
            certifications: null,
            languages: null,
            summary: null,
        };

        const result = cleanResumeContext(input);
        expect((result as any).version).toBeUndefined();
    });
});
