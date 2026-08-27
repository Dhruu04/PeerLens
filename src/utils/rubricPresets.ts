import type { GradingScaleField } from './math';

export interface RubricPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  targetScale: number;
  fields: Array<Omit<GradingScaleField, 'id'> & { id?: string }>;
}

export const RUBRIC_PRESETS: RubricPreset[] = [
  {
    id: 'aacu_teamwork',
    name: 'AAC&U Teamwork VALUE Rubric',
    category: 'Higher Education Benchmark',
    description: 'Gold standard higher education peer evaluation rubric established by the Association of American Colleges & Universities.',
    targetScale: 20,
    fields: [
      {
        name: 'Contributing to Team Meetings',
        description: 'Actively articulates ideas, advances team discussion, listens to others, and respects team meeting schedules.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Facilitating Teammate Contributions',
        description: 'Invites and encourages contributions from all team members; bridges different perspectives constructively.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Individual Work Quality & Rigor',
        description: 'Produces thorough, high-quality deliverables that advance project goals with high attention to detail.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Fostering Constructive Team Climate',
        description: 'Treats teammates with respect, maintains a positive collaborative attitude, and motivates team progress.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Conflict Resolution & Professionalism',
        description: 'Handles disagreements constructively, focuses on shared project goals, and accepts team compromises.',
        min: 1,
        max: 20,
        weight: 1
      }
    ]
  },
  {
    id: 'abet_engineering',
    name: 'ABET Engineering Criteria 5',
    category: 'Engineering & STEM',
    description: 'Accreditation board standard for engineering, computing, and applied science team project assessments.',
    targetScale: 20,
    fields: [
      {
        name: 'Technical Contribution & Problem Solving',
        description: 'Formulates technical solutions, executes core engineering tasks, and verifies deliverables with rigor.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Milestone Delivery & Project Reliability',
        description: 'Delivers project milestones on schedule, attends scheduled sessions, and fulfills agreed technical commitments.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Technical Communication & Sharing',
        description: 'Shares code, models, and documentation clearly; conducts constructive technical reviews with peers.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Inclusive Teamwork & Ethics',
        description: 'Values diverse inputs, upholds engineering ethics, and fosters psychological safety within the team.',
        min: 1,
        max: 20,
        weight: 1
      }
    ]
  },
  {
    id: 'agile_scrum',
    name: 'Agile & Scrum Sprint Peer Review',
    category: 'Software & Technology',
    description: 'Modern development team peer review measuring sprint velocity, code craftsmanship, and team collaboration.',
    targetScale: 20,
    fields: [
      {
        name: 'Sprint Velocity & Output',
        description: 'Delivers committed sprint stories and tasks with consistent output across the sprint cycle.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Craftsmanship & Quality',
        description: 'Writes clean, well-tested, maintainable code or documentation meeting definition of done (DoD).',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Standup Transparency & Communication',
        description: 'Provides transparent progress updates, flags blockers early, and coordinates actively during standups.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Unblocking Peers & Code Reviews',
        description: 'Conducts thoughtful PR code reviews, helps unblock teammates, and shares technical context willingly.',
        min: 1,
        max: 20,
        weight: 1
      }
    ]
  },
  {
    id: 'standard_academic',
    name: 'Standard 4-Dimensional Core',
    category: 'General Academic',
    description: 'Balanced, universally applicable academic peer evaluation measuring effort, quality, communication, and dependability.',
    targetScale: 20,
    fields: [
      {
        name: 'Quality of Contribution',
        description: 'Excellence, accuracy, and depth of work contributed to the project deliverables.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Collaboration & Communication',
        description: 'Active engagement, transparency, responsive messaging, and positive cooperative attitude.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Reliability & Deadlines',
        description: 'Punctuality, meeting milestone deadlines, and dependable follow-through on assignments.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Initiative & Effort',
        description: 'Proactive work ethic, proposing solutions, and taking ownership when challenges arise.',
        min: 1,
        max: 20,
        weight: 1
      }
    ]
  },
  {
    id: 'creative_design',
    name: 'Design & Creative Studio Review',
    category: 'Design & Creative Arts',
    description: 'Studio critique framework focusing on conceptual ideation, visual execution, critique receptivity, and collaboration.',
    targetScale: 20,
    fields: [
      {
        name: 'Ideation & Creative Exploration',
        description: 'Generates original concepts, explores diverse creative avenues, and pushes beyond obvious solutions.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Visual Execution & Craftsmanship',
        description: 'Delivers polished prototypes, high visual fidelity, typography, and refined aesthetic execution.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Critique Receptivity & Growth',
        description: 'Actively receives and integrates peer critique constructively; gives insightful feedback to others.',
        min: 1,
        max: 20,
        weight: 1
      },
      {
        name: 'Studio Work Ethic & Deadlines',
        description: 'Meets production schedules, actively participates in pin-ups and studio critiques, and respects deadlines.',
        min: 1,
        max: 20,
        weight: 1
      }
    ]
  }
];
