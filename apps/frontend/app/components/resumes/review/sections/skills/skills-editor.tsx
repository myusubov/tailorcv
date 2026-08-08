'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Icon } from '@iconify/react';
import { Reorder } from 'framer-motion';
import type { BaseResumeData } from 'shared';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { CategorySection } from './category-section';
import { SkillInlineInput } from './skill-inline-input';

/**
 * Main Skills Editor component.
 * Orchestrates category splitting, skill reordering, and persists changes to the global resume form state.
 */
export function SkillsEditor() {
  const { control } = useFormContext<BaseResumeData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'skills',
  });

  const handleRemoveSkill = (index: number) => {
    remove(index);
  };

  // Local interaction state
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newSkillValue, setNewSkillValue] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');

  // UI state for category ordering
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  // Tracking prev discovered to sync state during render (avoids cascading render lint error)
  const [prevDiscovered, setPrevDiscovered] = useState<string[]>([]);

  /**
   * Derives unique categories from the current skills data.
   */
  const discoveredCategories = useMemo(() => {
    const cats = new Set<string>();
    fields.forEach((field) => {
      const cat = field.category || 'Other';
      cats.add(cat);
    });
    return Array.from(cats);
  }, [fields]);

  /**
   * Synchronize the visual category order state with the underlying data.
   * Performed during render to satisfy ESLint and prevent double-renders.
   */
  if (
    discoveredCategories.length !== prevDiscovered.length ||
    discoveredCategories.some((c, i) => c !== prevDiscovered[i])
  ) {
    setPrevDiscovered(discoveredCategories);
    setCategoryOrder((prev) => {
      const existing = new Set(prev);
      const toAdd = discoveredCategories.filter((cat) => !existing.has(cat));
      const stillExists = new Set(discoveredCategories);
      const filteredPrev = prev.filter((cat) => stillExists.has(cat));

      if (toAdd.length === 0 && filteredPrev.length === prev.length) {
        return prev;
      }
      return [...filteredPrev, ...toAdd];
    });
  }

  /**
   * Groups the skills by category for efficient rendering and reordering logic.
   * Each skill is enriched with its absolute index in the parent field array.
   */
  const groupedSkills = useMemo(() => {
    const groups: Record<
      string,
      Array<(typeof fields)[number] & { _index: number }>
    > = {};

    fields.forEach((field, index) => {
      const cat = field.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...field, _index: index });
    });

    return groups;
  }, [fields]);

  /**
   * Handles reordering of whole category sections.
   * This is the "Block Move" logic: it relocates the entire set of skills
   * for the moved category to a new contiguous position in the flat array.
   */
  const handleReorderCategories = (newOrder: string[]) => {
    // 1. Identify which category was moved
    const movedCatIndex = newOrder.findIndex(
      (cat, i) => cat !== categoryOrder[i],
    );
    if (movedCatIndex === -1) return;

    const movedCat = newOrder[movedCatIndex];
    const skillsToMove = groupedSkills[movedCat] || [];

    // 2. Calculate the target starting index in the flat array
    // It's the sum of the lengths of all categories that now come before it
    let targetFlatIndex = 0;
    for (let i = 0; i < movedCatIndex; i++) {
      const catAtI = newOrder[i];
      targetFlatIndex += (groupedSkills[catAtI] || []).length;
    }

    // 3. Persistently move each skill in the block
    // We iterate through the skills of the moved category and move them
    // to their new relative positions starting from targetFlatIndex
    skillsToMove.forEach((skill, offset) => {
      // We must find the CURRENT index because previous move() calls shift the array
      const currentIdx = fields.findIndex((f) => f.id === skill.id);
      if (currentIdx !== -1) {
        move(currentIdx, targetFlatIndex + offset);
      }
    });

    // 4. Update local UI order
    setCategoryOrder(newOrder);
  };

  /**
   * Handles reordering of skills within a specific category.
   * Finds the item that changed position and calls the field array 'move' method.
   */
  const handleReorderSkills = (
    category: string,
    newSkills: (typeof fields)[number][],
  ) => {
    const oldSkills = groupedSkills[category];
    if (!oldSkills) return;

    for (let i = 0; i < newSkills.length; i++) {
      if (newSkills[i].id !== oldSkills[i]?.id) {
        const movedItem = newSkills[i];
        const oldPos = oldSkills.findIndex((s) => s.id === movedItem.id);

        if (oldPos !== -1) {
          // Perform persistent swap in the form data
          move(oldSkills[oldPos]._index, oldSkills[i]._index);
          return;
        }
      }
    }
  };

  /**
   * Persists a new skill to the form state.
   */
  const handleAddSkill = (category: string) => {
    const trimmed = newSkillValue.trim();
    if (!trimmed) {
      setAddingToCategory(null);
      setNewSkillValue('');
      return;
    }

    const currentCategorySkills = groupedSkills[category] || [];
    if (
      currentCategorySkills.some(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error('Skill already exists in this category');
      return;
    }

    append({
      id: nanoid(),
      name: trimmed,
      category: category === 'Other' ? null : category,
      level: null,
    });
    setNewSkillValue('');
  };

  /**
   * Transition state to start adding skills to a new category.
   */
  const handleAddCategory = () => {
    const trimmed = newCategoryValue.trim();
    if (!trimmed) {
      setIsAddingCategory(false);
      setNewCategoryValue('');
      return;
    }

    if (
      categoryOrder.some((cat) => cat.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error('Category already exists');
      return;
    }

    setIsAddingCategory(false);
    setNewCategoryValue('');
    setAddingToCategory(trimmed); // Triggers the inline input for the new category name
  };

  const displayCategories = useMemo(() => {
    const cats = [...categoryOrder];
    if (addingToCategory && !cats.includes(addingToCategory)) {
      cats.push(addingToCategory);
    }
    return cats;
  }, [categoryOrder, addingToCategory]);

  return (
    <div className="space-y-4 pt-0.5">
      <Reorder.Group
        axis="y"
        values={categoryOrder}
        onReorder={handleReorderCategories}
        className="space-y-4"
      >
        {displayCategories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            skills={groupedSkills[category] || []}
            isAdding={addingToCategory === category}
            newSkillValue={newSkillValue}
            setNewSkillValue={setNewSkillValue}
            onAddSkill={() => handleAddSkill(category)}
            onCancelAdd={() => setAddingToCategory(null)}
            onStartAdd={() => setAddingToCategory(category)}
            onRemoveSkill={handleRemoveSkill}
            onReorderSkills={(newSkills) =>
              handleReorderSkills(category, newSkills)
            }
          />
        ))}
      </Reorder.Group>

      {/* Persistence trigger for new category creation */}
      <div className="pt-2">
        {isAddingCategory ? (
          <div className="inline-flex items-center gap-2 px-1">
            <SkillInlineInput
              value={newCategoryValue}
              onChange={setNewCategoryValue}
              onSubmit={handleAddCategory}
              onCancel={() => {
                setIsAddingCategory(false);
                setNewCategoryValue('');
              }}
              placeholder="Category name..."
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="text-muted hover:text-accent inline-flex items-center gap-1.5 px-1 text-xs transition-colors"
          >
            <Icon icon="lucide:plus" className="size-3.5" />
            Add category
          </button>
        )}
      </div>

      {fields.length === 0 && !isAddingCategory && (
        <p className="text-muted py-8 text-center text-sm italic">
          No skills added yet. Start by adding a category.
        </p>
      )}
    </div>
  );
}
