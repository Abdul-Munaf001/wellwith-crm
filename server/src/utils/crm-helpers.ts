/**
 * Phone number normalization (defaults to India +91)
 */
export function normalizePhone(raw: string): { phone: string; isValid: boolean } {
  if (!raw) return { phone: '', isValid: false };
  
  // Remove all non-digit characters except leading +
  let cleaned = raw.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = '+91' + cleaned.slice(3).replace(/\D/g, '');
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+91' + cleaned.slice(1);
  } else if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned;
  }

  // Validate: Indian mobile numbers typically start with 6, 7, 8, or 9 and have 10 digits after +91
  const digitsAfterCountry = cleaned.replace('+91', '');
  const isValid = cleaned.startsWith('+91') && digitsAfterCountry.length === 10 && /^[6-9]/.test(digitsAfterCountry);

  return {
    phone: cleaned,
    isValid,
  };
}

/**
 * Calculates Lead Heat Score (0 - 100)
 * Factors:
 * 1. Source Intent Weight (Meta: 20, Google: 30, Website/Referral: 35, Walk-in: 40)
 * 2. Stage Progression (New: 10, Contacted: 20, Assessment: 30, Consultation: 40, Program: 50)
 * 3. Call Outcomes (Interested: +25, Call Back: +10, Busy: 0, Not Interested: -20)
 * 4. Recency decay (created within 24h: +15, 48h: +10, >7d: -10)
 * 5. Budget readiness: +10
 */
export function calculateHeatScore(params: {
  source?: string;
  status?: string;
  temperature?: string;
  budgetRange?: string | null;
  lastOutcome?: string | null;
  createdAt: Date;
  intakeCompleted?: boolean;
}): number {
  let score = 30; // base

  // 1. Source intent
  const src = (params.source || '').toLowerCase();
  if (src.includes('referral') || src.includes('walk-in')) score += 25;
  else if (src.includes('google') || src.includes('website')) score += 20;
  else if (src.includes('meta') || src.includes('instagram')) score += 15;

  // 2. Stage
  const status = params.status || 'New Enquiry';
  if (status === 'Program Enrolled' || status === 'Active Member') score += 35;
  else if (status === 'Consultation Booked' || status === 'Trial/Demo Attended') score += 25;
  else if (status === 'Wellness Assessment Done') score += 20;
  else if (status === 'Contacted') score += 10;
  else if (status === 'Lost') return 15;

  // 3. Last Call Outcome
  if (params.lastOutcome === 'Interested') score += 20;
  else if (params.lastOutcome === 'Call Back Later') score += 10;
  else if (params.lastOutcome === 'Not Interested' || params.lastOutcome === 'Wrong Number') score -= 25;

  // 4. Intake completed bonus
  if (params.intakeCompleted) score += 10;

  // 5. Budget readiness
  if (params.budgetRange && params.budgetRange.includes('25,000')) score += 10;

  // 6. Recency
  const hoursSinceCreation = (Date.now() - new Date(params.createdAt).getTime()) / 3600000;
  if (hoursSinceCreation < 6) score += 15;
  else if (hoursSinceCreation < 24) score += 10;
  else if (hoursSinceCreation > 168) score -= 15; // older than 7 days

  return Math.max(5, Math.min(100, Math.round(score)));
}

/**
 * Speed-to-lead status and elapsed minutes
 */
export function getSpeedToLeadMetrics(createdAt: Date, lastContactedAt: Date | null) {
  const createdTime = new Date(createdAt).getTime();
  const contactTime = lastContactedAt ? new Date(lastContactedAt).getTime() : Date.now();
  const elapsedMinutes = Math.round((contactTime - createdTime) / 60000);

  let status: 'fast' | 'warning' | 'breached';
  if (elapsedMinutes <= 15) {
    status = 'fast'; // Green
  } else if (elapsedMinutes <= 60) {
    status = 'warning'; // Amber
  } else {
    status = 'breached'; // Red
  }

  return {
    elapsedMinutes,
    isContacted: !!lastContactedAt,
    status,
  };
}

/**
 * Smart Program Matching & Talking Points based on lead's wellness goal
 */
export function getSmartProgramMatch(wellnessGoal: string | null | undefined) {
  const goal = (wellnessGoal || '').toLowerCase();

  if (goal.includes('weight') || goal.includes('fat') || goal.includes('metabolic')) {
    return {
      suggestedProgram: '30-Day Metabolic Reset & Fat Loss',
      priceINR: 8999,
      keyBenefit: 'Sustained fat burn without crash calorie restrictions.',
      talkingPoints: [
        'Understand their typical afternoon energy crashes & sugar cravings.',
        'Emphasize doctor-supervised nutrition with zero artificial meal shakes.',
        'Offer our complimentary 15-minute metabolic assessment slot today.',
      ],
    };
  }

  if (goal.includes('stress') || goal.includes('sleep') || goal.includes('anxiety') || goal.includes('cortisol')) {
    return {
      suggestedProgram: 'Holistic Stress & Cortisol Balance',
      priceINR: 6499,
      keyBenefit: 'Clinically proven breathwork and circadian alignment to lower resting cortisol.',
      talkingPoints: [
        'Ask about sleep latency: does it take more than 30 mins to fall asleep?',
        'Highlight noticeable sleep quality improvements within the first 5 days.',
        'Mention daily 10-minute restorative evening pranayama guided routine.',
      ],
    };
  }

  if (goal.includes('diabetes') || goal.includes('sugar') || goal.includes('hba1c')) {
    return {
      suggestedProgram: 'Type 2 Diabetes Reversal & Nutrition',
      priceINR: 18500,
      keyBenefit: 'Doctor-supervised low glycemic nutrition protocol to naturally taper medication.',
      talkingPoints: [
        'Inquire about recent fasting glucose and HbA1c levels.',
        'Share case study: average 1.8% drop in HbA1c over 90 days.',
        'Continuous clinical dietitian monitoring and doctor weekly reviews.',
      ],
    };
  }

  if (goal.includes('yoga') || goal.includes('flexibility') || goal.includes('back') || goal.includes('pain')) {
    return {
      suggestedProgram: 'Mind-Body Yoga & Flexibility Intensive',
      priceINR: 4999,
      keyBenefit: 'Posture correction, spinal decompression, and morning vitality flows.',
      talkingPoints: [
        'Address desk-bound stiffness in neck, shoulders, and lower spine.',
        'Live interactive batches at 7:00 AM and 6:30 PM with personalized form correction.',
        'Includes 1-on-1 joint mobility audit.',
      ],
    };
  }

  if (goal.includes('pcos') || goal.includes('hormon') || goal.includes('period')) {
    return {
      suggestedProgram: 'PCOS Harmony & Hormonal Health',
      priceINR: 12000,
      keyBenefit: 'Root-cause hormonal regulation, cycle regularity, and natural androgen balance.',
      talkingPoints: [
        'Validate the emotional fatigue of dealing with irregular cycles and stubborn weight.',
        'Customized seed cycling, inositol supplementation, and stress reduction.',
        'Guided by female health coaches with proven reversal protocols.',
      ],
    };
  }

  // Default Gut health / General
  return {
    suggestedProgram: 'Gut Microbiome & Detox Protocol',
    priceINR: 9500,
    keyBenefit: 'Rebuild healthy gut flora, eliminate chronic bloating, and boost immune resilience.',
    talkingPoints: [
      'Inquire about post-meal bloating and food intolerances.',
      'Explain the gut-brain axis connection to energy and skin clarity.',
      'Structured 45-day elimination and restorative food protocol.',
    ],
  };
}
