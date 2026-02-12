import { describe, it, expect } from 'vitest';
import { baseResumeDataSchema } from './resume';

describe('Base Resume Data Schema', () => {
    const validContact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        headline: 'Software Architect',
        phone: '+123456789',
        location: 'New York, US',
        websiteUrl: 'https://johndoe.com',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        githubUrl: 'https://github.com/johndoe',
    };

    it('should validate a complete, valid resume object', () => {
        const validResume = {
            version: 1,
            contact: validContact,
            summary: 'Experienced architect specializing in trust engines.',
            skills: [
                { id: 's1', name: 'TypeScript', category: 'Frontend', level: 'ADVANCED' }
            ],
            experiences: [
                {
                    id: 'e1',
                    company: 'Trust Corp',
                    title: 'Lead Architect',
                    location: 'Remote',
                    startDate: '2020-01',
                    endDate: '2023-12',
                    isCurrent: false,
                    tech: ['Docker', 'Node.js'],
                    bullets: [{ id: 'b1', text: 'Built the trust engine from scratch.' }]
                }
            ],
            projects: [],
            education: [],
        };

        const result = baseResumeDataSchema.safeParse(validResume);
        expect(result.success).toBe(true);
    });

    describe('Optional String Schema (Centralized Helper)', () => {
        it('should allow null for optional fields', () => {
            const data = { ...validContact, phone: null, location: null };
            const result = baseResumeDataSchema.shape.contact.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBeNull();
            }
        });

        it('should transform empty string to null', () => {
            const data = { ...validContact, headline: '' };
            const result = baseResumeDataSchema.shape.contact.safeParse(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.headline).toBeNull();
            }
        });

        it('should fail on whitespace-only strings (enforcing quality)', () => {
            const data = { ...validContact, location: '   ' };
            const result = baseResumeDataSchema.shape.contact.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Social Media / URL Validation', () => {
        it('should strictly validate LinkedIn hostnames', () => {
            const data = { ...validContact, linkedinUrl: 'https://facebook.com/johndoe' };
            const result = baseResumeDataSchema.shape.contact.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should strictly validate GitHub hostnames', () => {
            const data = { ...validContact, githubUrl: 'https://gitlab.com/johndoe' };
            const result = baseResumeDataSchema.shape.contact.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should allow empty/null social urls', () => {
            const data = { ...validContact, githubUrl: null, linkedinUrl: '' };
            const result = baseResumeDataSchema.shape.contact.safeParse(data);
            expect(result.success).toBe(true);
        });
    });

    describe('Date Integrity (Experience/Education)', () => {
        it('should fail if endDate is before startDate', () => {
            const experience = {
                id: 'e1',
                company: 'Old Corp',
                title: 'Dev',
                startDate: '2023-01',
                endDate: '2022-01',
                isCurrent: false,
                bullets: []
            };

            const result = baseResumeDataSchema.shape.experiences.element.safeParse(experience);
            expect(result.success).toBe(false);
        });

        it('should require startDate if isCurrent is true', () => {
            const experience = {
                id: 'e1',
                company: 'Now Corp',
                title: 'Dev',
                startDate: '', // Invalid format
                isCurrent: true,
                bullets: []
            };
            const result = baseResumeDataSchema.shape.experiences.element.safeParse(experience);
            expect(result.success).toBe(false);
        });
    });
});
