export const POINTS_CONFIG = {
  EVENT_POST: 10,
  EVENT_SOLVE: 20,
  EVENT_VERIFY: 5,
  FIRST_POST: 50,
  BADGE_AWARD: 25,
};

export const BADGES = {
  FIRST_POST: {
    name: 'first post',
    description: 'Posted your first event',
    threshold: 1,
    field: 'pointsPosted',
  },
  PROBLEM_SOLVER: {
    name: 'problem solver',
    description: 'Solved 10 events',
    threshold: 200, // 10 events * 20 points
    field: 'pointsSolved',
  },
  COMMUNITY_HERO: {
    name: 'community hero',
    description: 'Earned 500 total points',
    threshold: 500,
    field: 'totalPoints',
  },
  TOP_POSTER: {
    name: 'top poster of month',
    description: 'Most events posted this month',
    threshold: 50,
    field: 'pointsPosted',
  },
};

export const TRANSACTION_TYPES = {
  EVENT_POSTED: 'event_posted',
  EVENT_SOLVED: 'event_solved',
  BADGE_AWARDED: 'badge_awarded',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
};

export const EVENT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
};