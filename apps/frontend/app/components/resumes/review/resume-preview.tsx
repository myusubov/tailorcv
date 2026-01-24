import React from 'react';
import type { BaseResumeData } from 'shared';
import { cn } from '@heroui/react';

interface ResumePreviewProps {
  data: BaseResumeData;
  className?: string;
  scale?: number;
}

// ... (ResumePreviewProps remains unchanged)

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
  const isPresent = isExplicitlyTrue;
  const formattedEnd = isPresent ? 'Present' : formatDate(end);

  if (!formattedStart && !formattedEnd) return null;
  if (!formattedStart) return <span className="font-bold">{formattedEnd}</span>;

  return (
    <span className="min-w-[80px] text-right font-bold">
      {formattedStart}
      {formattedEnd ? ` – ${formattedEnd}` : ''}
    </span>
  );
};

/**
 * ResumePreview renders an A4-style resume that auto-scales to fit its container.
 * Uses ResizeObserver to dynamically adjust scale based on available width.
 * @param data - The resume data to display
 * @param className - Additional classes for the outer container
 * @param scale - Optional max scale cap (auto-scaling still runs, but won't exceed this)
 */
export function ResumePreview({
  data,
  className,
  scale: maxScale = 1.0,
}: ResumePreviewProps) {
  console.log(`[Re-render Check] ResumePreview rendered at ${new Date().toLocaleTimeString()}`);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [computedScale, setComputedScale] = React.useState<number>(0.5);
  const [contentHeight, setContentHeight] = React.useState<number>(0);

  // A4 dimensions in pixels at 96 DPI (210mm x 297mm)
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  // Measure content height to determine how many pages we need
  React.useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use borderBoxSize if available to include padding in height calculation
        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
          setContentHeight(entry.borderBoxSize[0].blockSize);
        } else {
          // Fallback for older browsers (manually add vertical padding of 80px)
          setContentHeight(entry.contentRect.height + 80);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [data]); // Re-measure when data changes

  // Update scale based on container width
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      if (!containerWidth) return;

      const MIN_SCALE = 0.3;
      const MAX_SCALE = maxScale;

      // Scale to fit width perfectly (subtract padding)
      const idealScale = (containerWidth - 32) / A4_WIDTH_PX;
      const clampedScale = Math.max(MIN_SCALE, Math.min(idealScale, MAX_SCALE));

      setComputedScale(clampedScale);
    };

    // Run immediately
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => observer.disconnect();
  }, [maxScale]);

  if (!data) return null;

  const {
    contact,
    summary,
    skills = [],
    experiences = [],
    projects = [],
    education = [],
  } = data;

  const safeEducation = education || [];

  // Determine actual height to render (at least one page)
  // We round UP to the nearest full page so the background looks like valid paper sheets
  const rawHeight = Math.max(contentHeight, A4_HEIGHT_PX);
  const pageCount = Math.ceil(rawHeight / A4_HEIGHT_PX) || 1;
  const totalHeight = pageCount * A4_HEIGHT_PX;

  // Calculate scaled dimensions for the wrapper
  const scaledWidth = A4_WIDTH_PX * computedScale;
  const scaledHeight = totalHeight * computedScale;

  return (
    <div
      ref={containerRef}
      className={cn('flex w-full justify-center', className)}
    >
      {/* Wrapper sized to scaled dimensions */}
      <div
        className="relative shrink-0 transition-all duration-200 ease-out"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        {/* Scaled Content Container */}
        <div
          className="absolute top-0 left-0 origin-top-left bg-white text-black shadow-2xl"
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${totalHeight}px`, // Force full paper height
            transform: `scale(${computedScale})`,
          }}
        >
          {/* Page Break Indicators */}
          <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
            {Array.from({ length: pageCount }).map((_, i) => (
              <React.Fragment key={i}>
                {/* Minimalist Page Number (Side) */}
                <div
                  className="absolute -left-10 flex items-center justify-end"
                  style={{
                    top: `${i * A4_HEIGHT_PX}px`,
                    height: `${A4_HEIGHT_PX}px`,
                    width: '40px',
                    transform: `scale(${1 / computedScale})`,
                    transformOrigin: 'top right',
                  }}
                >
                  <span className="-rotate-90 text-[11px] font-medium tracking-wide whitespace-nowrap text-slate-400/80 select-none">
                    PAGE {i + 1}
                  </span>
                </div>

                {/* Elegant Page Divider */}
                {i > 0 && (
                  <div
                    className="absolute left-0 flex w-full items-center justify-end pr-8"
                    style={{ top: `${i * A4_HEIGHT_PX}px` }}
                  >
                    {/* Soft Blueprint Line (Absolute so it spans full width) */}
                    <div className="absolute left-0 w-full border-t border-dashed border-indigo-200/80" />

                    {/* Floating Badge (Relative so it sits on top) */}
                    <div
                      className="relative z-10 rounded-full border border-indigo-100/50 bg-white/90 px-3 py-1 text-[9px] font-bold tracking-[0.2em] text-indigo-400 uppercase shadow-sm backdrop-blur-[2px] select-none"
                      style={{
                        transform: `scale(${1 / computedScale})`,
                        transformOrigin: 'right center',
                      }}
                    >
                      Page Break
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Actual Resume Content */}
          <div
            ref={contentRef}
            style={{
              padding: '40px', // Standard margin
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="mb-3 text-[28px] leading-tight font-bold tracking-wide uppercase">
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
                <div className="mt-2 mb-1.5 flex items-center">
                  <h2 className="mr-2 text-[14px] font-bold tracking-wide uppercase">
                    Summary
                  </h2>
                  <div className="flex-1 border-t-2 border-black" />
                </div>
                <p className="textAlign-justify text-[13px] leading-relaxed">
                  {summary}
                </p>
              </div>
            )}

            {/* Education */}
            {safeEducation.length > 0 && (
              <div className="mb-4">
                <div className="mt-2 mb-1.5 flex items-center">
                  <h2 className="mr-2 text-[14px] font-bold tracking-wide uppercase">
                    Education
                  </h2>
                  <div className="flex-1 border-t-2 border-black" />
                </div>
                {safeEducation.map((edu, index) => (
                  <div key={edu.id || index} className="mb-3">
                    <div className="mb-0.5 flex items-baseline justify-between">
                      <span className="text-[13px] font-bold">
                        {edu.school}
                      </span>
                      <span className="text-[12px] font-bold">
                        {renderDateRange(
                          edu.startDate,
                          edu.endDate,
                          edu.isCurrent,
                        )}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] italic">
                        {edu.degree}
                        {edu.field ? ` in ${edu.field}` : ''}
                        {edu.grade && ` (GPA: ${edu.grade})`}
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
                <div className="mt-2 mb-1.5 flex items-center">
                  <h2 className="mr-2 text-[14px] font-bold tracking-wide uppercase">
                    Experience
                  </h2>
                  <div className="flex-1 border-t-2 border-black" />
                </div>
                {experiences.map((exp, index) => (
                  <div
                    key={exp.id || index}
                    className="mb-3 break-inside-avoid"
                  >
                    <div className="mb-0.5 flex items-baseline justify-between">
                      <span className="text-[13px] font-bold">
                        {exp.company}
                      </span>
                      <span className="text-[12px] font-bold">
                        {renderDateRange(
                          exp.startDate,
                          exp.endDate,
                          exp.isCurrent,
                        )}
                      </span>
                    </div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-[13px] italic">{exp.title}</span>
                      {exp.location && (
                        <span className="text-[13px]">{exp.location}</span>
                      )}
                    </div>
                    <ul className="ml-3 list-none">
                      {(exp.bullets || []).map((bullet, i) => (
                        <li
                          key={bullet.id || i}
                          className="mb-0.5 flex items-start"
                        >
                          <span className="mr-1.5 text-[14px] leading-tight">
                            •
                          </span>
                          <span className="flex-1 text-justify text-[13px] leading-snug">
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
                <div className="mt-2 mb-1.5 flex items-center">
                  <h2 className="mr-2 text-[14px] font-bold tracking-wide uppercase">
                    Projects
                  </h2>
                  <div className="flex-1 border-t-2 border-black" />
                </div>
                {projects.map((proj, index) => (
                  <div
                    key={proj.id || index}
                    className="mb-3 break-inside-avoid"
                  >
                    <div className="mb-0.5 flex items-baseline justify-between">
                      <span className="text-[13px] font-bold">{proj.name}</span>
                      <span className="text-[12px] font-bold">
                        {renderDateRange(
                          proj.startDate,
                          proj.endDate,
                          proj.isCurrent,
                        )}
                      </span>
                    </div>
                    <div className="mb-1 flex flex-wrap items-center gap-x-2 text-[13px] italic">
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
                        <li
                          key={bullet.id || i}
                          className="mb-0.5 flex items-start"
                        >
                          <span className="mr-1.5 text-[14px] leading-tight">
                            •
                          </span>
                          <span className="flex-1 text-justify text-[13px] leading-snug">
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
                <div className="mt-2 mb-1.5 flex items-center">
                  <h2 className="mr-2 text-[14px] font-bold tracking-wide uppercase">
                    Technical Skills
                  </h2>
                  <div className="flex-1 border-t-2 border-black" />
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
                      <span className="mr-2 font-bold">{category}:</span>
                      <span className="flex-1">{names.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
