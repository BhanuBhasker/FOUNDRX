export const PRIMARY_ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'product', label: 'Product' },
  { value: 'other', label: 'Other' },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'not_available', label: 'Not available' },
];

export const STARTUP_GOAL_OPTIONS = [
  { value: 'find_cofounder', label: 'Find a Co-Founder' },
  { value: 'join_startup', label: 'Join a Startup' },
  { value: 'build_projects', label: 'Build Projects' },
  { value: 'explore_ideas', label: 'Explore Ideas' },
];

export const PROFILE_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public — visible in Discover' },
  { value: 'private', label: 'Private — hidden from Discover' },
];

export const STARTUP_STAGE_OPTIONS = [
  { value: 'idea', label: 'Idea' },
  { value: 'validating', label: 'Validating' },
  { value: 'building', label: 'Building' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

export const REQUIRED_SKILL_PRIORITY_OPTIONS = [
  { value: 'required', label: 'Required' },
  { value: 'nice_to_have', label: 'Nice to have' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

export const MILESTONE_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export const SORT_OPTIONS = [
  { value: 'compatibility', label: 'Best match' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'newest', label: 'Newest profiles' },
  { value: 'name', label: 'Name (A-Z)' },
];

export const APPLICATION_TYPE_LABELS = {
  cofounder_request: 'Co-founder request',
  startup_application: 'Startup application',
  team_invitation: 'Team invitation',
};
