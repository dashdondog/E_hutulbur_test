import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function truncateText(text: string, maxChars = 6000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[... текст хасагдсан ...]";
}

async function generateJSON(prompt: string, retries = 2): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < retries) {
        console.log(`Rate limited, waiting 10s before retry (attempt ${attempt + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("generateJSON: бүх оролдлого амжилтгүй");
}

// Step 1a: Extract just chapter names (small response)
async function extractChapterNames(
  subjectName: string,
  text: string
): Promise<string[]> {
  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. Доорх сурах бичгийн агуулгаас ЗӨВХӨН бүлгүүдийн нэрийг ялгаж гарга.

Сурах бичгийн агуулга:
${truncateText(text)}

ЗААВАР:
- Номонд хэдэн бүлэг байгааг олж тогтоо.
- Бүлэг бүрийн нэрийг МОНГОЛ КИРИЛЛ үсгээр зөв бичнэ.
- Хэрэв текст гажигтай (латин үсгээр) харагдвал, утгыг нь тааж ЗӨӨВ МОНГОЛ хэлээр бичнэ.
- Жишээ: "KBAAPAT TOPWATT" → "Квадрат тэгшитгэл"

JSON формат:
{
  "chapters": ["Бүлэг 1. Нэр", "Бүлэг 2. Нэр"]
}`);
  const result = JSON.parse(jsonStr);
  return result.chapters;
}

// Step 1b: Extract topics for ALL chapters and distribute across 10 weeks
async function extractTopicsForChapters(
  subjectName: string,
  chapterNames: string[],
  text: string
): Promise<{ weekNumber: number; topicName: string; description: string; hours: number; chapterIndex: number }[]> {
  const chapterList = chapterNames.map((n, i) => `${i + 1}. ${n}`).join("\n");

  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. Дараах бүлгүүдийн сэдвүүдийг олж, БҮХ сэдвийг 10 долоо хоногт хуваарьла.

Бүлгүүд:
${chapterList}

Сурах бичгийн агуулга:
${truncateText(text, 5000)}

ЗААВАР:
- Бүлэг бүрийн сэдвүүдийг олж гаргана.
- БҮХ бүлгийн бүх сэдвийг НИЙЛҮҮЛЭЭД 10 долоо хоногт хуваарьла (weekNumber: 1-10).
- Бүлгүүд дарааллаар хуваарьлагдана.
- chapterIndex нь 0-ээс эхэлнэ (0 = эхний бүлэг).
- Сэдвийг МОНГОЛ КИРИЛЛ үсгээр зөв бичнэ.
- Сэдэв бүрт 2 цаг өг.
- Хариу БОГИНО байна. Тайлбар нь 5-10 үг.

JSON формат:
{
  "topics": [
    { "weekNumber": 1, "topicName": "1.1 Сэдэв", "description": "Товч", "hours": 2, "chapterIndex": 0 },
    { "weekNumber": 2, "topicName": "1.2 Сэдэв", "description": "Товч", "hours": 2, "chapterIndex": 0 }
  ]
}`);
  const result = JSON.parse(jsonStr);
  return result.topics;
}

// Step 1: Full schedule extraction (two-step: chapters then topics)
export async function extractSchedule(
  subjectName: string,
  text: string
): Promise<{
  chapters: {
    name: string;
    topics: { weekNumber: number; topicName: string; description: string; hours: number }[];
  }[];
}> {
  // Step 1a: Get chapter names (small, reliable call)
  const chapterNames = await extractChapterNames(subjectName, text);

  if (!chapterNames || chapterNames.length === 0) {
    return { chapters: [] };
  }

  // Step 1b: Get all topics distributed across 10 weeks
  const allTopics = await extractTopicsForChapters(subjectName, chapterNames, text);

  // Group topics by chapter
  const chapters = chapterNames.map((name, index) => ({
    name,
    topics: allTopics
      .filter(t => t.chapterIndex === index)
      .map(({ weekNumber, topicName, description, hours }) => ({ weekNumber, topicName, description, hours })),
  }));

  // Remove chapters with no topics
  return { chapters: chapters.filter(ch => ch.topics.length > 0) };
}

// Step 2: Generate detailed lesson plan for ONE chapter (with pre-assigned topics)
export async function generateChapterPlan(
  subjectName: string,
  chapterName: string,
  topics: { weekNumber: number; topicName: string; description: string; hours: number }[],
  text: string
): Promise<{
  name: string;
  goal: string;
  content: {
    subject: string;
    grade: string;
    chapter: string;
    topicSchedule: { weekNumber: number; topicName: string; description: string; hours: number }[];
    duration: string;
    goal: string;
    objectives: string[];
    lessonForm: string;
    methods: string[];
    materials: string[];
    steps: { time: string; phase: string; teacherActivity: string; studentActivity: string; methods: string; assessment: string }[];
    homework: string;
    reflection: string;
  };
  criteria: { name: string; percentage: number; description: string }[];
}> {
  const topicList = topics.map(t => `${t.weekNumber}-р долоо хоног: ${t.topicName}`).join(", ");

  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. "${chapterName}" бүлгээр нэгж хөтөлбөр бэлд.

Энэ бүлгийн сэдвүүд: ${topicList}

Сурах бичгийн холбогдох агуулга:
${truncateText(text, 3000)}

Монгол хэлээр дэлгэрэнгүй бичнэ. Зөвхөн JSON:

{
  "name": "Нэгж хөтөлбөр - ${chapterName}",
  "goal": "Бүлгийн зорилго (2-3 өгүүлбэр, дэлгэрэнгүй)",
  "content": {
    "subject": "${subjectName}",
    "grade": "11-р анги",
    "chapter": "${chapterName}",
    "topicSchedule": ${JSON.stringify(topics)},
    "duration": "80 минут (2 цаг)",
    "goal": "Сурагчид энэ бүлгийн хүрээнд юу мэдэж, чаддаг болох (дэлгэрэнгүй)",
    "objectives": [
      "Мэдлэгийн зорилт: (дэлгэрэнгүй бичих)",
      "Чадварын зорилт: (дэлгэрэнгүй бичих)",
      "Хандлагын зорилт: (дэлгэрэнгүй бичих)"
    ],
    "lessonForm": "Лекц-семинар / Лаборатори гэх мэт",
    "methods": ["Тайлбарлах арга", "Асуудал шийдвэрлэх арга", "Бүлгийн хэлэлцүүлэг", "Бие даасан ажил"],
    "materials": ["Сурах бичиг", "Самбар", "Проектор", "Ажлын хуудас"],
    "steps": [
      { "time": "5 мин", "phase": "Хичээлийн эхлэл", "teacherActivity": "(дэлгэрэнгүй)", "studentActivity": "(дэлгэрэнгүй)", "methods": "Асуулт-хариулт", "assessment": "Амаар" },
      { "time": "25 мин", "phase": "Шинэ мэдлэг олгох", "teacherActivity": "(дэлгэрэнгүй)", "studentActivity": "(дэлгэрэнгүй)", "methods": "Лекц", "assessment": "Ажиглалт" },
      { "time": "20 мин", "phase": "Бататгах / Дадлага", "teacherActivity": "(дэлгэрэнгүй)", "studentActivity": "(дэлгэрэнгүй)", "methods": "Бие даасан ажил", "assessment": "Даалгавар" },
      { "time": "15 мин", "phase": "Чадвар хөгжүүлэх", "teacherActivity": "(дэлгэрэнгүй)", "studentActivity": "(дэлгэрэнгүй)", "methods": "Хэрэглээ", "assessment": "Бичгийн ажил" },
      { "time": "10 мин", "phase": "Үнэлгээ / Дүгнэлт", "teacherActivity": "(дэлгэрэнгүй)", "studentActivity": "(дэлгэрэнгүй)", "methods": "Эргэцүүлэл", "assessment": "Өөрийн үнэлгээ" },
      { "time": "5 мин", "phase": "Гэрийн даалгавар", "teacherActivity": "(тайлбарлах)", "studentActivity": "Тэмдэглэх", "methods": "", "assessment": "" }
    ],
    "homework": "Гэрийн даалгаврын дэлгэрэнгүй тайлбар",
    "reflection": "Хичээлийн эргэцүүлэл"
  },
  "criteria": [
    { "name": "Идэвхтэй оролцоо", "percentage": 10, "description": "Хичээлд идэвхтэй оролцох" },
    { "name": "Даалгаврын гүйцэтгэл", "percentage": 30, "description": "Хичээл дээрх дадлага ажил" },
    { "name": "Бие даасан ажил", "percentage": 20, "description": "Гэрийн даалгавар, реферат" },
    { "name": "Явцын шалгалт", "percentage": 20, "description": "Бүлгийн шалгалт" },
    { "name": "Улирлын шалгалт", "percentage": 20, "description": "Нэгдсэн шалгалт" }
  ]
}`);
  return JSON.parse(jsonStr);
}

// Legacy
export async function generateCurriculum(subjectName: string, text: string) {
  const schedule = await extractSchedule(subjectName, text);
  const ch = schedule.chapters[0];
  const plan = await generateChapterPlan(subjectName, ch.name, ch.topics, text);
  return { ...plan, weeks: 10 };
}

export async function generateTopics(
  subjectName: string,
  text: string
): Promise<
  { name: string; description: string; subtopics: string[] }[]
> {
  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. Доорх сурах бичгийн агуулгаас бүх сэдвүүдийг ялгаж гаргаж өг.

Сурах бичгийн агуулга:
${truncateText(text)}

Бүлэг/сэдэв бүрийг ялгаж, дэд сэдвүүдтэй нь гаргана уу.

Дараах JSON формат руу яг тохируулж хариулна уу (бусад тайлбар бүү бич):
[
  {
    "name": "Сэдвийн нэр (Жишээ: 1-р бүлэг. Кинематик)",
    "description": "Сэдвийн товч тайлбар",
    "subtopics": ["Дэд сэдэв 1", "Дэд сэдэв 2"]
  }
]`);
  return JSON.parse(jsonStr);
}

export async function generateTestForTopic(
  subjectName: string,
  topicName: string,
  subtopics: string[],
  text: string,
  questionCount: number = 10
): Promise<{
  name: string;
  duration: number;
  questions: {
    text: string;
    type: "multiple" | "truefalse";
    options: string[];
    correctAnswer: number;
    points: number;
  }[];
}> {
  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. "${topicName}" сэдвээр ${questionCount} асуулттай тест бэлдэж өг.

Дэд сэдвүүд: ${subtopics.join(", ")}

Сурах бичгийн холбогдох агуулга:
${truncateText(text, 2000)}

Дараах шаардлагатай:
- Олон сонголттой (4 хариулттай, 1 зөв) болон Үнэн/Худал асуултууд холино
- Асуултууд сурах бичгийн агуулгад тулгуурласан байна
- Хэцүү, дунд, хялбар асуултууд холилдсон байна
- Асуулт бүрт оноо (хялбар=1, дунд=2, хэцүү=3)

Дараах JSON формат руу яг тохируулж хариулна уу (бусад тайлбар бүү бич):
{
  "name": "${topicName} - Шалгалт",
  "duration": 40,
  "questions": [
    {
      "text": "Асуултын текст?",
      "type": "multiple",
      "options": ["A хариулт", "B хариулт", "C хариулт", "D хариулт"],
      "correctAnswer": 0,
      "points": 1
    },
    {
      "text": "Үнэн/Худал асуулт?",
      "type": "truefalse",
      "options": ["Үнэн", "Худал"],
      "correctAnswer": 0,
      "points": 1
    }
  ]
}`);
  return JSON.parse(jsonStr);
}
