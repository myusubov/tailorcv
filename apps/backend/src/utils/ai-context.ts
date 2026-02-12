import { BaseResumeData } from 'shared';

/**
 * Removes internal IDs and metadata from the resume context to save tokens.
 * Returns a new object without mutating the original.
 */
export function cleanResumeContext(data: BaseResumeData): any {
    // Create a shallow copy to avoid mutating the input
    const clean: any = { ...data };

    // Remove version if present
    delete clean.version;

    // Helper to remove ID from an object
    const removeId = <T extends { id?: string }>(item: T): Omit<T, 'id'> => {
        const { id, ...rest } = item;
        return rest;
    };

    // Clean arrays if they exist
    if (clean.skills) {
        clean.skills = clean.skills.map(removeId);
    }

    if (clean.experiences) {
        clean.experiences = clean.experiences.map((exp: any) => {
            const { id, bullets, ...rest } = exp;
            return {
                ...rest,
                bullets: bullets?.map(removeId),
            };
        });
    }

    if (clean.projects) {
        clean.projects = clean.projects.map((proj: any) => {
            const { id, bullets, ...rest } = proj;
            return {
                ...rest,
                bullets: bullets?.map(removeId),
            };
        });
    }

    if (clean.education) {
        clean.education = clean.education.map(removeId);
    }

    if (clean.certifications) {
        clean.certifications = clean.certifications.map(removeId);
    }

    if (clean.languages) {
        clean.languages = clean.languages.map(removeId);
    }

    return clean;
}
