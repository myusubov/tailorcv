import { getResume } from '@/lib/data/resumes';

const STATUS_STYLES = {
  GENERATING: 'bg-warning/15 text-warning',
  READY: 'bg-success/15 text-success',
  FAILED: 'bg-danger/15 text-danger',
} as const;

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-default px-3 py-1 text-sm">
      {children}
    </span>
  );
}

export default async function ResumePage(props: PageProps<'/resumes/[id]'>) {
  const { id } = await props.params;
  const result = await getResume({ params: { id } });

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p>
          Could not load resume {id}: {result.status} {result.error.message}
        </p>
      </main>
    );
  }

  const resume = result.data;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-3">
        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[resume.status]}`}
        >
          {resume.status}
          {resume.failureReason ? `: ${resume.failureReason}` : ''}
        </span>
        <h1 className="text-3xl font-bold">{resume.headline}</h1>
        <p className="leading-relaxed text-muted">{resume.summary}</p>
      </header>

      <section aria-labelledby="skills-heading" className="flex flex-col gap-4">
        <h2
          id="skills-heading"
          className="border-b border-separator pb-2 text-xl font-semibold"
        >
          Skills
        </h2>
        {resume.skillGroups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted">
              {group.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section
        aria-labelledby="projects-heading"
        className="flex flex-col gap-4"
      >
        <h2
          id="projects-heading"
          className="border-b border-separator pb-2 text-xl font-semibold"
        >
          Projects
        </h2>
        {resume.projects.map((project) => (
          <article
            key={project.id}
            className="flex flex-col gap-3 rounded-xl border border-separator bg-surface p-5"
          >
            <div>
              <h3 className="text-lg font-semibold">{project.name}</h3>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  className="text-sm text-accent hover:underline"
                >
                  {project.repoUrl}
                </a>
              )}
            </div>
            <p className="text-muted">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <Chip key={tool}>{tool}</Chip>
              ))}
            </div>
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              {project.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
