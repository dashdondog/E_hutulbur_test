export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface WeekPlan {
  week: string;
  topic: string;
  description: string;
  hours: number;
}

export interface CriteriaItem {
  name: string;
  percentage: number;
  description: string;
}

// Нэгж сэдвийн хөтөлбөр (Unit Lesson Plan) - new template format
export interface LessonStep {
  time: string;       // e.g. "5 мин", "15 мин"
  phase: string;      // e.g. "Хичээлийн эхлэл", "Шинэ мэдлэг олгох"
  teacherActivity: string;
  studentActivity: string;
  methods: string;
  assessment: string;
}

export interface TopicWeek {
  weekNumber: number;      // 1-10
  topicName: string;
  description: string;
  hours: number;
}

export interface LessonPlan {
  subject: string;
  grade: string;
  chapter: string;         // Бүлгийн нэр
  topicSchedule: TopicWeek[]; // Сэдвүүдийн 10 долоо хоногийн хуваарь
  duration: string;
  goal: string;
  objectives: string[];
  lessonForm: string;
  methods: string[];
  materials: string[];
  steps: LessonStep[];
  homework: string;
  reflection: string;
  // legacy fields
  topic?: string;
  weekNumber?: number;
}

export interface Curriculum {
  id: string;
  subjectId: string;
  name: string;
  goal: string;
  content: string | WeekPlan[] | LessonPlan;
  criteria: string | CriteriaItem[];
  weeks: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  subtopics: string[];
  order: number;
}

export interface Question {
  id: string;
  text: string;
  type: "multiple" | "truefalse" | "open";
  options: string[];
  correctAnswer: number; // index for multiple, 0=Үнэн/1=Худал for truefalse
  points: number;
}

export interface Test {
  id: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  name: string;
  duration: number; // minutes
  questions: Question[];
  createdAt: string;
}
