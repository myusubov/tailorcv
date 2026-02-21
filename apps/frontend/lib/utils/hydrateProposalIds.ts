import { nanoid } from 'nanoid';
import type { BaseResumeData } from 'shared';

/**
 * Item with an optional id and a primary key field used for matching against existing data.
 */
type WithOptionalId<T> = Omit<T, 'id'> & { id?: string };

/**
 * Hydrates AI proposal arrays with IDs before merging into form data.
 *
 * The AI intentionally omits `id` fields to save tokens, but the form schema
 * requires them (`idSchema = z.string().min(1)`). This function:
 * - Matches existing items by their natural key (name, company+title, school, etc.)
 *   and preserves their original `id`.
 * - Assigns a new `nanoid()` to genuinely new items.
 * - Recursively handles nested `bullets` inside experiences and projects.
 *
 * @param params.proposal - The AI-generated partial resume data (may lack `id` fields)
 * @param params.currentData - The current form data with valid IDs
 * @returns A new proposal object with all array items guaranteed to have `id` fields
 */
export function hydrateProposalIds({
  proposal,
  currentData,
}: {
  proposal: unknown;
  currentData: BaseResumeData;
}): unknown {
  if (typeof proposal !== 'object' || proposal === null || Array.isArray(proposal)) {
    return proposal;
  }

  const result = { ...proposal } as Record<string, unknown>;

  if (Array.isArray(result.skills)) {
    result.skills = hydrateArray({
      items: result.skills as WithOptionalId<BaseResumeData['skills'][number]>[],
      existing: currentData.skills,
      getKey: (s) => s.name?.toLowerCase() ?? '',
    });
  }

  if (Array.isArray(result.experiences)) {
    result.experiences = hydrateArrayWithBullets({
      items: result.experiences as WithOptionalId<BaseResumeData['experiences'][number]>[],
      existing: currentData.experiences,
      getKey: (e) => `${e.company?.toLowerCase()}|${e.title?.toLowerCase()}`,
    });
  }

  if (Array.isArray(result.projects)) {
    result.projects = hydrateArrayWithBullets({
      items: result.projects as WithOptionalId<BaseResumeData['projects'][number]>[],
      existing: currentData.projects,
      getKey: (p) => p.name?.toLowerCase() ?? '',
    });
  }

  if (Array.isArray(result.education)) {
    result.education = hydrateArray({
      items: result.education as WithOptionalId<NonNullable<BaseResumeData['education']>[number]>[],
      existing: currentData.education ?? [],
      getKey: (e) => `${e.school?.toLowerCase()}|${e.degree?.toLowerCase()}`,
    });
  }

  if (Array.isArray(result.certifications)) {
    result.certifications = hydrateArray({
      items: result.certifications as WithOptionalId<NonNullable<BaseResumeData['certifications']>[number]>[],
      existing: currentData.certifications ?? [],
      getKey: (c) => c.name?.toLowerCase() ?? '',
    });
  }

  if (Array.isArray(result.languages)) {
    result.languages = hydrateArray({
      items: result.languages as WithOptionalId<NonNullable<BaseResumeData['languages']>[number]>[],
      existing: currentData.languages ?? [],
      getKey: (l) => l.name?.toLowerCase() ?? '',
    });
  }

  return result;
}

/**
 * Hydrates an array of items with IDs by matching against existing data.
 * Items without an `id` are matched by their natural key; unmatched items get a new ID.
 */
function hydrateArray<T extends { id: string }>({
  items,
  existing,
  getKey,
}: {
  items: WithOptionalId<T>[];
  existing: T[];
  getKey: (item: WithOptionalId<T>) => string;
}): T[] {
  // Build a lookup from natural key → existing id
  const keyToId = new Map<string, string>();
  for (const item of existing) {
    keyToId.set(getKey(item as unknown as WithOptionalId<T>), item.id);
  }

  return items.map((item) => {
    // If the item already has an id, keep it
    if (item.id) return item as T;

    const key = getKey(item);
    const existingId = keyToId.get(key);

    return { ...item, id: existingId ?? nanoid() } as T;
  });
}

/**
 * Hydrates arrays that contain nested `bullets` (experiences, projects).
 * Handles both the parent item IDs and the nested bullet IDs.
 */
function hydrateArrayWithBullets<
  T extends { id: string; bullets: { id: string; text: string }[] },
>({
  items,
  existing,
  getKey,
}: {
  items: WithOptionalId<T>[];
  existing: T[];
  getKey: (item: WithOptionalId<T>) => string;
}): T[] {
  // Build lookups for parent items and their bullets
  const keyToExisting = new Map<string, T>();
  for (const item of existing) {
    keyToExisting.set(getKey(item as unknown as WithOptionalId<T>), item);
  }

  return items.map((item) => {
    const key = getKey(item);
    const existingItem = keyToExisting.get(key);

    // Hydrate parent id
    const id = item.id ?? existingItem?.id ?? nanoid();

    // Hydrate bullet ids
    const rawBullets = (item as Record<string, unknown>).bullets;
    let bullets = existingItem?.bullets ?? [];

    if (Array.isArray(rawBullets)) {
      const existingBullets = existingItem?.bullets ?? [];
      // Build text → id lookup for matching bullets
      const textToId = new Map<string, string>();
      for (const b of existingBullets) {
        textToId.set(b.text.toLowerCase(), b.id);
      }

      bullets = rawBullets.map((b: { id?: string; text: string }) => ({
        ...b,
        id: b.id ?? textToId.get(b.text?.toLowerCase()) ?? nanoid(),
      }));
    }

    return { ...item, id, bullets } as T;
  });
}
