// Simple, self-contained goal evaluation utility for mobile client
// Produces a strict JSON object per the requested schema.

export type GoalType = 'WALKING_RUNNING' | 'WORKOUT' | 'CYCLING' | 'SWIMMING' | 'SPORTS';

export interface GoalEvaluationInput {
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  deadlineISO: string | null; // ISO 8601 or null
}

export interface GoalEvaluationResult {
  is_realistic: boolean;
  warning_message: string | null;
  target_value: number;
  unit: string;
  days_to_complete: number;
  goal_type: GoalType;
  tips: [string, string, string];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const daysBetweenToday = (deadlineISO: string) => {
  const now = new Date();
  const dl = new Date(deadlineISO);
  const ms = dl.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

function detectGoalType(title: string, description: string, unit: string): GoalType {
  const text = `${title} ${description}`.toLowerCase();
  if (/(run|walk|jog|5k|10k|marathon)/.test(text) || /km|mile|m\b/.test(unit.toLowerCase())) {
    return 'WALKING_RUNNING';
  }
  if (/(cycle|bike|biking)/.test(text)) return 'CYCLING';
  if (/(swim|swimming|pool|laps)/.test(text)) return 'SWIMMING';
  if (/(football|soccer|tennis|basketball|volleyball)/.test(text)) return 'SPORTS';
  return 'WORKOUT';
}

function minDaysForDistanceKm(goalType: GoalType, km: number): number {
  // Heuristics for safe beginner progression
  // Running is stricter than cycling/swimming
  if (goalType === 'WALKING_RUNNING') {
    if (km <= 3) return 28; // 4 weeks
    if (km <= 5) return 49; // 7 weeks
    if (km <= 10) return 84; // 12 weeks
    if (km <= 21.1) return 168; // 24 weeks
    return 224; // very long distances
  }
  if (goalType === 'CYCLING') {
    if (km <= 20) return 21;
    if (km <= 50) return 35;
    if (km <= 100) return 56;
    return 84;
  }
  if (goalType === 'SWIMMING') {
    if (km <= 1) return 28;
    if (km <= 2) return 56;
    return 84;
  }
  // For generic SPORTS/WORKOUT when unit is km but not clearly running/cycling/swimming
  return 28;
}

function minDaysForWeightLossKg(kg: number): number {
  // Safe 0.25–1.0 kg per week; use 0.5 kg/week as a reasonable estimate
  const kgPerWeek = 0.5;
  return Math.ceil((kg / kgPerWeek)) * 7;
}

function inferDistanceKm(value: number, unit: string): number | null {
  const u = unit.toLowerCase();
  if (u === 'km' || u === 'kilometer' || u === 'kilometers') return value;
  if (u === 'miles' || u === 'mile' || u === 'mi') return value * 1.60934;
  if (u === 'm' || u === 'meter' || u === 'meters') return value / 1000;
  return null;
}

function isWeightLoss(title: string, description: string, unit: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return /(lose|weight|fat|body fat|kg|lbs)/.test(text) && /(kg|kilogram|lb|lbs)/.test(unit.toLowerCase());
}

function buildTips(goalType: GoalType): [string, string, string] {
  switch (goalType) {
    case 'WALKING_RUNNING':
      return [
        'Maintain upright posture; short steps and steady breathing.',
        'Increase distance or time by 5–10% weekly.',
        'Warm up, cool down, and rest if pain or dizziness occurs.',
      ];
    case 'CYCLING':
      return [
        'Set saddle height for slight knee bend at bottom stroke.',
        'Add 10–15 mins per ride each week.',
        'Hydrate, wear a helmet, and avoid sudden workload jumps.',
      ];
    case 'SWIMMING':
      return [
        'Focus on relaxed breathing and streamlined body position.',
        'Add 2–4 laps weekly; rest between sets.',
        'Use intervals and rest days to prevent shoulder strain.',
      ];
    case 'SPORTS':
      return [
        'Drill fundamentals; prioritize technique over intensity.',
        'Progress volume/intensity gradually each week.',
        'Use proper gear and schedule recovery to avoid injuries.',
      ];
    case 'WORKOUT':
    default:
      return [
        'Use controlled form; full range of motion.',
        'Increase sets, reps, or load by 5–10% weekly.',
        'Sleep 7–9 hours and deload if joints feel sore.',
      ];
  }
}

export function evaluateGoalForSafety(input: GoalEvaluationInput): GoalEvaluationResult {
  const { title, description, targetValue, unit, deadlineISO } = input;
  const goal_type = detectGoalType(title, description, unit);

  // Determine baseline minimal days
  let minDays = 21; // conservative default
  let adjustedTarget = targetValue;
  const distanceKm = inferDistanceKm(targetValue, unit);
  const weightGoal = isWeightLoss(title, description, unit);

  if (distanceKm !== null) {
    minDays = minDaysForDistanceKm(goal_type, distanceKm);
  } else if (weightGoal) {
    // Normalize to kg if lbs used
    let kg = targetValue;
    if (/lb|lbs/.test(unit.toLowerCase())) kg = targetValue * 0.453592;
    minDays = minDaysForWeightLossKg(kg);
  } else {
    // Generic workout/sports: ensure at least 21 days for meaningful habit/skill
    minDays = goal_type === 'WORKOUT' ? 21 : 28;
  }

  const daysRequested = deadlineISO ? daysBetweenToday(deadlineISO) : null;
  let is_realistic = true;
  let warning_message: string | null = null;
  let days_to_complete = daysRequested ?? minDays;

  if (daysRequested === null) {
    // No deadline: suggest safe minimal days
    days_to_complete = minDays;
  } else {
    // With deadline: compare
    if (daysRequested < minDays) {
      is_realistic = false;
      days_to_complete = minDays;
      // Propose safer adjustment:
      // If user insists on the deadline, scale target down linearly
      if (distanceKm !== null) {
        const scale = clamp(daysRequested / minDays, 0.3, 1);
        const proposedKm = Math.max(0.5, distanceKm * scale);
        // Convert back to input unit where sensible
        if (/mile|mi/.test(unit.toLowerCase())) {
          adjustedTarget = Number((proposedKm / 1.60934).toFixed(1));
        } else if (unit.toLowerCase() === 'm') {
          adjustedTarget = Math.round(proposedKm * 1000);
        } else {
          adjustedTarget = Number(proposedKm.toFixed(1));
        }
      } else if (weightGoal) {
        // Cap weekly loss at ~0.5 kg/week
        const safeKg = Math.max(0.5, Math.floor((daysRequested / 7) * 0.5 * 10) / 10);
        if (/lb|lbs/.test(unit.toLowerCase())) {
          adjustedTarget = Number((safeKg / 0.453592).toFixed(1));
        } else {
          adjustedTarget = Number(safeKg.toFixed(1));
        }
      } else {
        // Generic: modest scaling
        const scale = clamp(daysRequested / minDays, 0.4, 1);
        adjustedTarget = Number((targetValue * scale).toFixed(1));
      }
      warning_message = 'Requested deadline is likely unsafe/unrealistic. Suggested a safer target or longer timeline.';
    } else {
      days_to_complete = daysRequested;
    }
  }

  const tips = buildTips(goal_type);

  return {
    is_realistic,
    warning_message,
    target_value: adjustedTarget,
    unit,
    days_to_complete,
    goal_type,
    tips,
  };
}


