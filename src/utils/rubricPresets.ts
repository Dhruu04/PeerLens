import type { GradingScaleField } from './math';

export interface RubricPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  targetScale: number;
  fields: Array<Omit<GradingScaleField, 'id'> & { id?: string }>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  INTEGRATED PEER ASSESSMENT FRAMEWORK (IPAF)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  A single, research-synthesized rubric preset derived from the most widely
 *  cited and psychometrically validated peer evaluation instruments in higher
 *  education and organizational psychology:
 *
 *  PRIMARY SOURCES
 *  ───────────────
 *  1. CATME (Comprehensive Assessment of Team Member Effectiveness)
 *     Ohland, M.W., Loughry, M.L., Woehr, D.J., Bullard, L.G., Felder, R.M.,
 *     Finelli, C.J., Layton, R.A., Pomeranz, H.R., & Schmucker, D.G. (2012).
 *     "The Comprehensive Assessment of Team Member Effectiveness: Development
 *     of a Behaviorally Anchored Rating Scale for Self- and Peer Evaluation."
 *     Academy of Management Learning & Education, 11(4), 609–630.
 *
 *  2. Salas's Big Five Model of Teamwork
 *     Salas, E., Sims, D.E., & Burke, C.S. (2005). "Is there a 'Big Five' in
 *     Teamwork?" Small Group Research, 36(5), 555–599.
 *
 *  3. AAC&U VALUE Teamwork Rubric
 *     Association of American Colleges & Universities (2009). Teamwork VALUE
 *     Rubric. Washington, DC: AAC&U.
 *
 *  4. WebPA / Loughborough University Framework
 *     Willmot, P. & Crawford, A. (2007). "Peer Review of Team Marks Using
 *     WebPA – An Evaluation." Engineering Education, 2(1), 59–73.
 *
 *  5. Falchikov & Goldfinch Meta-Analysis
 *     Falchikov, N. & Goldfinch, J. (2000). "Student Peer Assessment in Higher
 *     Education: A Meta-Analysis." Review of Educational Research, 70(3),
 *     287–322.
 *
 *  DESIGN RATIONALE
 *  ────────────────
 *  • Follows the empirical "4–6 criteria" guideline for optimal rubric depth
 *    (prevents rater fatigue while maintaining discriminant validity).
 *  • Uses behaviorally anchored descriptions aligned with CATME BARS methodology.
 *  • Applies differentiated weighting: contribution-oriented dimensions (Task
 *    Contribution, Reliability) receive 20% each, while process-oriented
 *    dimensions (Communication, Leadership, Quality Standards, Knowledge)
 *    receive 15% each — reflecting research consensus that observable output
 *    and dependability are the strongest predictors of peer-perceived
 *    effectiveness (Ohland et al., 2012; Falchikov & Goldfinch, 2000).
 *  • Total weight sums to 100 for intuitive percentage-based interpretation.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export const RUBRIC_PRESETS: RubricPreset[] = [
  {
    id: 'ipaf_research_synthesized',
    name: 'Integrated Peer Assessment Framework (IPAF)',
    category: 'Research-Synthesized Standard',
    description:
      'A unified, evidence-based peer evaluation rubric synthesized from CATME (Ohland et al., 2012), ' +
      'Salas\'s Big Five of Teamwork, the AAC&U VALUE Rubric, and the WebPA/Loughborough framework. ' +
      'Six behaviorally anchored dimensions with empirically informed weighting capture both ' +
      'contribution quality and collaborative process effectiveness.',
    targetScale: 20,
    fields: [
      // ── DIMENSION 1 ── Contribution-Oriented (Higher Weight: 20%) ──────────
      // Sources: CATME "Contributing to the Team's Work" + Salas "Team Orientation"
      // + AAC&U "Contributing to Team Meetings"
      {
        name: 'Contribution Quality',
        description:
          'Did they complete their fair share of the work? Was their output accurate, ' +
          'thorough, and useful — or incomplete and rushed? High = strong, consistent ' +
          'output. Low = did less than their share or work had to be redone.',
        min: 1,
        max: 20,
        weight: 20
      },

      // ── DIMENSION 2 ── Contribution-Oriented (Higher Weight: 20%) ──────────
      // Sources: CATME "Keeping the Team on Track" + Salas "Mutual Performance Monitoring"
      // + WebPA "Time Management / Reliability"
      {
        name: 'Reliability',
        description:
          'Could you count on them? Did they meet deadlines, attend meetings, and ' +
          'follow through without reminders? High = always dependable. ' +
          'Low = missed deadlines, skipped meetings, or left others to cover.',
        min: 1,
        max: 20,
        weight: 20
      },

      // ── DIMENSION 3 ── Process-Oriented (Standard Weight: 15%) ─────────────
      // Sources: CATME "Having Relevant KSAs" + Salas "Adaptability" + "Backup Behavior"
      {
        name: 'Problem-Solving',
        description:
          'Did they handle challenges well? Could they apply their skills, adapt when ' +
          'plans changed, and help teammates who were stuck? High = resourceful and ' +
          'flexible. Low = gave up easily or couldn\'t adjust.',
        min: 1,
        max: 20,
        weight: 15
      },

      // ── DIMENSION 4 ── Process-Oriented (Standard Weight: 15%) ─────────────
      // Sources: CATME "Interacting with Teammates" + AAC&U "Fostering Constructive
      // Team Climate" + Topping "Peer Feedback Effectiveness"
      {
        name: 'Communication',
        description:
          'Did they communicate clearly, listen to others, and respond on time? Did ' +
          'they give useful feedback and accept suggestions without defensiveness? ' +
          'High = team felt heard and respected. Low = unresponsive or dismissive.',
        min: 1,
        max: 20,
        weight: 15
      },

      // ── DIMENSION 5 ── Process-Oriented (Standard Weight: 15%) ─────────────
      // Sources: Salas "Team Leadership" + AAC&U "Facilitating Teammate Contributions"
      // + Falchikov: Initiative & Proactivity
      {
        name: 'Initiative',
        description:
          'Did they step up without being asked? Did they propose ideas, volunteer ' +
          'for tasks, and help the group make decisions? High = a driving force. ' +
          'Low = passive, waited for others to organize everything.',
        min: 1,
        max: 20,
        weight: 15
      },

      // ── DIMENSION 6 ── Process-Oriented (Standard Weight: 15%) ─────────────
      // Sources: CATME "Expecting Quality" + Loughborough "Quality Standards"
      {
        name: 'Quality Drive',
        description:
          'Did they push the team to do better, not just "good enough"? Did they ' +
          'care about the standard of the final output? High = raised the bar ' +
          'for everyone. Low = showed no concern for quality.',
        min: 1,
        max: 20,
        weight: 15
      }
    ]
  }
];
