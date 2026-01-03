'use client'

import { useBaseResumeQuery } from "@/lib/http/resumes-client";
import { useParams } from "next/navigation"

const ResumeReview = () => {
    const { id }: { id: string } = useParams()

  const { data: resumeData } = useBaseResumeQuery(
    { id },
    { enabled: !!id },
  );

  console.log(resumeData)

  return (
    <div>ResumeReview</div>
  )
}

export default ResumeReview