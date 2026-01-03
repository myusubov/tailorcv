'use client';

import type { BaseResumeData } from 'shared';
import { cn } from '@heroui/react';

interface ResumePreviewProps {
  data: BaseResumeData;
  className?: string;
  scale?: number;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length >= 2) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  return dateString;
};

const renderDateRange = (
  start?: string | null,
  end?: string | null,
  isCurrent?: boolean | null,
) => {
  const formattedStart = formatDate(start);
  const isExplicitlyFalse =
    isCurrent === false || String(isCurrent) === 'false';
  const isExplicitlyTrue = isCurrent === true || String(isCurrent) === 'true';
  const isPresent = isExplicitlyTrue || (!isExplicitlyFalse && !end && !!start);
  const formattedEnd = isPresent ? 'Present' : formatDate(end);

  if (!formattedStart && !formattedEnd) return null;
  if (!formattedStart) return <span className="font-bold">{formattedEnd}</span>;

  return (
    <span className="font-bold ttext-right min-w-[80px]">
      {formattedStart}
      {formattedEnd ? ` – ${formattedEnd}` : ''}
    </span>
  );
};

export function ResumePreview({
  data,
  className,
  scale = 1,
}: ResumePreviewProps) {
  if (!data) return null;

  const {
    contact,
    summary,
    skills = [],
    experiences = [],
    projects = [],
    education = [],
  } = data;

  const safeEducation = (education || []).filter((edu) => !edu.isSelfTaught);

  return (
    <div className={cn('flex justify-center', className)}>
      {/* A4 Container */}
      <div
        className="bg-white text-black shadow-lg"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '30px', // Matches PDF padding
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '13px', // ~10pt equivalent
          lineHeight: '1.4',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-[28px] font-bold uppercase tracking-wide mb-3 leading-tight">
            {contact.firstName} {contact.lastName}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-2 text-[12px] text-black">
            {contact.location && <span>{contact.location}</span>}
            {contact.phone && (
              <>
                {contact.location && <span>•</span>}
                <span>{contact.phone}</span>
              </>
            )}
            {(contact.location || contact.phone) && <span>•</span>}
            <a
              href={`mailto:${contact.email}`}
              className="text-black no-underline hover:underline"
            >
              {contact.email}
            </a>
            {contact.websiteUrl && (
              <>
                <span>•</span>
                <a
                  href={contact.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black no-underline hover:underline"
                >
                  Website
                </a>
              </>
            )}
            {contact.linkedinUrl && (
              <>
                <span>•</span>
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black no-underline hover:underline"
                >
                  LinkedIn
                </a>
              </>
            )}
            {contact.githubUrl && (
              <>
                <span>•</span>
                <a
                  href={contact.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black no-underline hover:underline"
                >
                  GitHub
                </a>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-4">
            <div className="flex items-center mb-1.5 mt-2">
              <h2 className="text-[14px] font-bold uppercase tracking-wide mr-2">
                Summary
              </h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            <p className="textAlign-justify text-[13px] leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        {/* Education */}
        {safeEducation.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-1.5 mt-2">
              <h2 className="text-[14px] font-bold uppercase tracking-wide mr-2">
                Education
              </h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            {safeEducation.map((edu, index) => (
              <div key={edu.id || index} className="mb-1">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[13px] font-bold">{edu.school}</span>
                  <span className="text-[12px] font-bold">
                    {renderDateRange(edu.startDate, edu.endDate)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] italic">
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ''}
                  </span>
                  {edu.location && (
                    <span className="text-[13px]">{edu.location}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-1.5 mt-2">
              <h2 className="text-[14px] font-bold uppercase tracking-wide mr-2">
                Experience
              </h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            {experiences.map((exp, index) => (
              <div key={exp.id || index} className="mb-3 break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[13px] font-bold">{exp.company}</span>
                  <span className="text-[12px] font-bold">
                    {renderDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[13px] italic">{exp.title}</span>
                  {exp.location && (
                    <span className="text-[13px]">{exp.location}</span>
                  )}
                </div>
                <ul className="ml-3 list-none">
                  {(exp.bullets || []).map((bullet, i) => (
                    <li key={bullet.id || i} className="flex items-start mb-0.5">
                      <span className="mr-1.5 text-[14px] leading-tight">
                        •
                      </span>
                      <span className="text-[13px] leading-snug text-justify flex-1">
                        {bullet.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-1.5 mt-2">
              <h2 className="text-[14px] font-bold uppercase tracking-wide mr-2">
                Projects
              </h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            {projects.map((proj, index) => (
              <div key={proj.id || index} className="mb-3 break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[13px] font-bold">{proj.name}</span>
                  <span className="text-[12px] font-bold">
                    {renderDateRange(
                      proj.startDate,
                      proj.endDate,
                      proj.isCurrent,
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap items-center text-[13px] italic mb-1 gap-x-2">
                  {proj.role && <span>{proj.role}</span>}
                  {(proj.url || proj.repoUrl) && proj.role && (
                    <span className="text-[10px] not-italic">•</span>
                  )}
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black no-underline hover:underline"
                    >
                      Live Demo
                    </a>
                  )}
                  {proj.url && proj.repoUrl && (
                    <span className="text-[10px] not-italic">•</span>
                  )}
                  {proj.repoUrl && (
                    <a
                      href={proj.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black no-underline hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                </div>
                <ul className="ml-3 list-none">
                  {(proj.bullets || []).map((bullet, i) => (
                    <li key={bullet.id || i} className="flex items-start mb-0.5">
                      <span className="mr-1.5 text-[14px] leading-tight">
                        •
                      </span>
                      <span className="text-[13px] leading-snug text-justify flex-1">
                        {bullet.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-1.5 mt-2">
              <h2 className="text-[14px] font-bold uppercase tracking-wide mr-2">
                Technical Skills
              </h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            <div className="space-y-0.5">
              {Object.entries(
                skills.reduce(
                  (acc: Record<string, string[]>, skill) => {
                    const cat = skill.category || 'Other';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(skill.name);
                    return acc;
                  },
                  {} as Record<string, string[]>,
                ),
              ).map(([category, names]) => (
                <div key={category} className="flex text-[13px]">
                  <span className="font-bold w-[120px] shrink-0">
                    {category}:
                  </span>
                  <span className="flex-1">{names.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
