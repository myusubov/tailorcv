'use client';

import React from 'react';
import type { BaseResumeData } from 'shared';
import { Icon } from '@iconify/react';

interface ResumePreviewProps {
  data: BaseResumeData;
  className?: string;
  style?: React.CSSProperties;
}

export function ResumePreview({ data, className, style }: ResumePreviewProps) {
  const { contact, summary, skills, experience, projects, education } = data;

  return (
    <div
      className={`overflow-hidden bg-white text-slate-900 shadow-2xl ${className || ''}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        ...style,
      }}
    >
      {/* Header */}
      <header className="mb-8 border-b-2 border-slate-900 pb-6">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase">
          {contact.firstName} {contact.lastName}
        </h1>
        <p className="mt-1 text-xl font-medium text-slate-600">
          {contact.headline || 'Professional'}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
          {contact.email && (
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:mail" className="size-4" />
              {contact.email}
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:phone" className="size-4" />
              {contact.phone}
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:map-pin" className="size-4" />
              {contact.location}
            </div>
          )}
          {contact.linkedinUrl && (
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:linkedin" className="size-4" />
              LinkedIn
            </div>
          )}
          {contact.githubUrl && (
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:github" className="size-4" />
              GitHub
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 border-b border-slate-100 pb-1 text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">
            Work Experience
          </h2>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="mb-1 flex items-baseline justify-between">
                  <h3 className="font-bold text-slate-900">{exp.company}</h3>
                  <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="mb-2 text-sm font-medium text-slate-600">
                  {exp.title}
                </div>
                <ul className="list-inside list-disc space-y-1">
                  {(exp.bullets || []).map((bullet) => (
                    <li
                      key={bullet.id}
                      className="pl-1 text-xs leading-relaxed text-slate-600 marker:text-slate-300"
                    >
                      {bullet.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 border-b border-slate-100 pb-1 text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">
            Projects
          </h2>
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id}>
                <div className="mb-1 flex items-baseline justify-between">
                  <h3 className="font-bold text-slate-900">{project.name}</h3>
                  <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    {project.startDate} — {project.endDate}
                  </span>
                </div>
                {project.role && (
                  <div className="mb-2 text-xs font-medium text-slate-500 uppercase">
                    {project.role}
                  </div>
                )}
                <ul className="list-inside list-disc space-y-1">
                  {(project.bullets || []).map((bullet) => (
                    <li
                      key={bullet.id}
                      className="pl-1 text-xs leading-relaxed text-slate-600 marker:text-slate-300"
                    >
                      {bullet.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* Skills */}
        {skills && skills.length > 0 && (
          <section>
            <h2 className="mb-3 border-b border-slate-100 pb-1 text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded border border-slate-100 bg-slate-50 px-2 py-1 font-medium text-slate-700"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section>
            <h2 className="mb-3 border-b border-slate-100 pb-1 text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="text-xs font-bold text-slate-900">
                    {edu.school}
                  </h3>
                  <p className="text-[10px] font-medium text-slate-600">
                    {edu.degree} in {edu.field}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {edu.startDate} — {edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
