export interface CourseConfigEntry {
  course: string;
  slug: string;
  comingSoon?: boolean;
}

export const COURSE_CONFIG: CourseConfigEntry[] = [
  { course: 'Algorithms and Data Structures', slug: 'algorithms-and-data-structures' },
  { course: 'Introduction to Machine Learning', slug: 'introduction-to-machine-learning', comingSoon: true },
  { course: 'Mat 1A', slug: 'mat-1a', comingSoon: true },
  { course: 'Mat 1B', slug: 'mat-1b', comingSoon: true },
  { course: 'Physics 1 Spring', slug: 'physics-1-spring', comingSoon: true },
  { course: 'Physics 1 Fall', slug: 'physics-1-fall', comingSoon: true },
  { course: 'Introduction to Statistics', slug: 'introduction-to-statistics', comingSoon: true },
];

export const COURSE_FILE_PATHS = COURSE_CONFIG.map(entry => ({
  course: entry.course,
  path: `data/cards/${entry.slug}/cards.json`,
}));

export const COMING_SOON_COURSES = COURSE_CONFIG.filter(entry => entry.comingSoon);