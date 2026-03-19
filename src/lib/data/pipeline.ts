import { PIPELINE_PROJECTS_EXTENDED } from "@/lib/mock-data"
import type { PipelineProject } from "@/types/database"

/**
 * Returns pipeline projects.
 * No pipeline_projects table exists in the schema yet (NAR-54 scraper covers listings,
 * not development projects). Static curated data is used until that table is added.
 */
export function getPipelineProjects(): PipelineProject[] {
  return PIPELINE_PROJECTS_EXTENDED
}
