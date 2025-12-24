import type { BaseResumeData } from 'shared';

export type BaseResume = {
  id: string;
  userId: string;
  name: string;
  data: BaseResumeData;
  createdAt: string;
  updatedAt: string;
};
