import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function truncateText(text: string, maxChars = 6000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[... текст хасагдсан ...]";
}

const MODEL_FALLBACK_ORDER = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

async function generateJSON(prompt: string, retries = 2): Promise<string> {
  const generationConfig = {
    temperature: 0.3,
    responseMimeType: "application/json",
  };

  for (let modelIndex = 0; modelIndex < MODEL_FALLBACK_ORDER.length; modelIndex++) {
    const modelName = MODEL_FALLBACK_ORDER[modelIndex];
    const model = genAI.getGenerativeModel({ model: modelName, generationConfig });

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (modelIndex > 0) {
          console.log(`Used fallback model: ${modelName}`);
        }
        return text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;

        if (status === 404) {
          console.log(`${modelName} not found (404), trying next model...`);
          break;
        }

        if (status === 503) {
          if (attempt < retries) {
            const delay = 10000 * (attempt + 1);
            console.log(`${modelName} 503, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${retries})...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          console.log(`${modelName} unavailable after ${retries + 1} attempts, trying next model...`);
          break;
        }

        if (status === 429) {
          // Check if daily quota exceeded — no point retrying this model
          const details = (err as { errorDetails?: { "@type": string; violations?: { quotaMetric?: string; quotaId?: string }[]; retryDelay?: string }[] }).errorDetails ?? [];
          const quotaFailure = details.find(d => d["@type"]?.includes("QuotaFailure"));
          const isDaily = quotaFailure?.violations?.some(v => v.quotaId?.toLowerCase().includes("perday"));
          if (isDaily) {
            console.log(`${modelName} daily quota exceeded, trying next model...`);
            break;
          }
          if (attempt < retries) {
            const retryInfo = details.find(d => d["@type"]?.includes("RetryInfo"));
            const retryDelaySec = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay) : 15;
            const delay = Math.min(retryDelaySec * 1000, 60000);
            console.log(`${modelName} rate limited, waiting ${delay / 1000}s (attempt ${attempt + 1}/${retries})...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          console.log(`${modelName} rate limit retries exhausted, trying next model...`);
          break;
        }

        throw err;
      }
    }
  }

  throw new Error("generateJSON: бүх загвар ашиглах боломжгүй байна");
}

// Step 1a: Extract just chapter names (small response)
async function extractChapterNames(
  subjectName: string,
  text: string,
  templateText: string
): Promise<string[]> {
  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. Багшийн оруулсан ЗАГВАР ХӨТӨЛБӨРИЙН ЗААВРЫН ДАГУУ бүлгүүдийг ялгаж гарга.

============ ЗАГВАР ХӨТӨЛБӨР (ЗААВАЛ ДАГАХ) ============
${truncateText(templateText, 4000)}
=======================================================

Сурах бичгийн агуулга (зөвхөн агуулга шалгахад):
${truncateText(text, 4000)}

ЗААВАР:
- ЗАГВАРТ заасан бүлгийн тоо, нэрлэх дүрэм, дугаарлалт, форматыг ЯГ дагаж мөрдөнө.
- Хэрэв загварт тодорхой бүлгийн нэр заасан бол ҮҮНИЙГ ӨӨРЧЛӨХГҮЙ. Зөвхөн дутууг сурах бичгээс нөхнө.
- Хэрэв загварт зөвхөн дүрэм/формат байгаа бол сурах бичгийн бүлгүүдийг тэр форматтай нийцүүлж бич.
- Бүлгийн нэрийг МОНГОЛ КИРИЛЛ үсгээр зөв бичнэ.

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
  text: string,
  templateText: string
): Promise<{ weekNumber: number; topicName: string; description: string; hours: number; chapterIndex: number }[]> {
  const chapterList = chapterNames.map((n, i) => `${i + 1}. ${n}`).join("\n");

  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. Багшийн оруулсан ЗАГВАР ХӨТӨЛБӨРИЙН ЗААВРЫН ДАГУУ сэдвүүдийг хуваарьла.

============ ЗАГВАР ХӨТӨЛБӨР (ЗААВАЛ ДАГАХ) ============
${truncateText(templateText, 4000)}
=======================================================

Бүлгүүд:
${chapterList}

Сурах бичгийн агуулга:
${truncateText(text, 4000)}

ЗААВАР:
- ЗАГВАРТ заасан сэдвийн нэр, дугаарлалт, тайлбарын стиль, цагийн хуваарилалтыг ЯГ дагаж мөрдөнө.
- Хэрэв загварт тухайн бүлгийн сэдвүүдийг тоочсон бол ҮҮНИЙГ ОРХИХГҮЙ ашиглана.
- Хэрэв загвар зөвхөн ерөнхий формат заасан бол сурах бичгийн сэдвүүдээс түүж тэр формат руу буулга.
- БҮХ сэдвийг 10 долоо хоногт хуваарьла (weekNumber: 1-10).
- chapterIndex нь 0-ээс эхэлнэ.
- Сэдэв бүрт цаг загварт заасны дагуу өг (заагаагүй бол 2 цаг).
- Хариу БОГИНО байна. Тайлбар нь 5-10 үг.

JSON формат:
{
  "topics": [
    { "weekNumber": 1, "topicName": "1.1 Сэдэв", "description": "Товч", "hours": 2, "chapterIndex": 0 }
  ]
}`);
  const result = JSON.parse(jsonStr);
  return result.topics;
}

// Step 1: Full schedule extraction (two-step: chapters then topics)
export async function extractSchedule(
  subjectName: string,
  text: string,
  templateText: string
): Promise<{
  chapters: {
    name: string;
    topics: { weekNumber: number; topicName: string; description: string; hours: number }[];
  }[];
}> {
  // Step 1a: Get chapter names (small, reliable call)
  const chapterNames = await extractChapterNames(subjectName, text, templateText);

  if (!chapterNames || chapterNames.length === 0) {
    return { chapters: [] };
  }

  // Step 1b: Get all topics distributed across 10 weeks
  const allTopics = await extractTopicsForChapters(subjectName, chapterNames, text, templateText);

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
  text: string,
  templateText: string
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

  const jsonStr = await generateJSON(`Чи 11-р ангийн "${subjectName}" хичээлийн багш. Багшийн оруулсан ЗАГВАР ХӨТӨЛБӨРИЙН ЗААВРЫН ДАГУУ "${chapterName}" бүлгээр нэгж хөтөлбөр бэлд.

============ ЗАГВАР ХӨТӨЛБӨР (ЗААВАЛ ЯГ ЭНЭ ЗААВРААР БИЧИХ) ============
${truncateText(templateText, 6000)}
====================================================================

ЯГ ДАГАХ ДҮРЭМ:
1. Зорилго, зорилт, арга, хэрэглэгдэхүүн, хичээлийн үе шат, үнэлгээний шалгуурын БИЧИХ ХЭЛБЭР, ҮГИЙН СОНГОЛТ, ДЭЛГЭРЭНГҮЙН ТҮВШИНГ загвартай ЯГ адилхан болго.
2. Загварт заасан үе шатны нэрс, цагийн хуваарь, аргын тоо, шалгуурын тоо болон хувийг ҮНДЭСНИЙ ЗААВАР гэж үзэн ДАГА.
3. Загварт жишээ үг хэллэг (зорилго: "...", шалгуур: "...") байвал тэр стилийг хуулна.
4. Загвараас ЗӨВХӨН тухайн бүлэгт хамаарах агуулгыг солино — хүрээ/бүтцийг битгий өөрчил.
5. Загварт заагаагүй талбарыг өөрөө бөглөж болох ч, заасан талбарыг ӨӨРЧЛӨХИЙГ ХОРИГЛОНО.

Энэ бүлгийн сэдвүүд: ${topicList}

Сурах бичгийн холбогдох агуулга (зөвхөн агуулгыг бөглөхөд ашиглана):
${truncateText(text, 2500)}

Монгол хэлээр бичнэ. Зөвхөн JSON формат:

{
  "name": "Нэгж хөтөлбөр - ${chapterName}",
  "goal": "Бүлгийн зорилго — ЗАГВАРЫН СТИЛИЙН ДАГУУ",
  "content": {
    "subject": "${subjectName}",
    "grade": "11-р анги",
    "chapter": "${chapterName}",
    "topicSchedule": ${JSON.stringify(topics)},
    "duration": "ЗАГВАРТ заасан хугацаа (заагаагүй бол 80 минут)",
    "goal": "Хичээлийн зорилго — ЗАГВАРЫН СТИЛЭЭР",
    "objectives": ["ЗАГВАРТ заасан тооны зорилт, тэр форматаар"],
    "lessonForm": "ЗАГВАРТ заасан хичээлийн хэлбэр",
    "methods": ["ЗАГВАРТ заасан аргуудыг ашиглана"],
    "materials": ["ЗАГВАРТ заасан хэрэглэгдэхүүнийг ашиглана"],
    "steps": [
      { "time": "ЗАГВАРААС", "phase": "ЗАГВАРААС", "teacherActivity": "...", "studentActivity": "...", "methods": "...", "assessment": "..." }
    ],
    "homework": "ЗАГВАРЫН СТИЛЭЭР",
    "reflection": "ЗАГВАРЫН СТИЛЭЭР"
  },
  "criteria": [
    { "name": "ЗАГВАРААС", "percentage": 0, "description": "ЗАГВАРААС" }
  ]
}`);
  return JSON.parse(jsonStr);
}

// Legacy
export async function generateCurriculum(subjectName: string, text: string, templateText: string) {
  const schedule = await extractSchedule(subjectName, text, templateText);
  const ch = schedule.chapters[0];
  const plan = await generateChapterPlan(subjectName, ch.name, ch.topics, text, templateText);
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

// Chat: edit an existing curriculum or test JSON via natural-language instructions.
// Returns: { reply, updated } — `updated` is the new full JSON, or null if no change.
export async function editViaChat(
  targetType: "curriculum" | "test",
  currentJson: unknown,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<{ reply: string; updated: unknown | null }> {
  const targetLabel =
    targetType === "curriculum" ? "Нэгж хөтөлбөр (LessonPlan)" : "Тест (Test)";
  const historyBlock =
    history.length > 0
      ? history
          .slice(-8)
          .map(m => (m.role === "user" ? `Багш: ${m.content}` : `AI: ${m.content}`))
          .join("\n")
      : "(Чат шинэ эхэлсэн)";

  const jsonStr = await generateJSON(`Чи багшид нь хөтөлбөр/тест засахад туслах AI туслах. Доорх ${targetLabel}-ийг багшийн хүсэлтийн дагуу зас.

============ ОДОО БАЙГАА АГУУЛГА (JSON) ============
${JSON.stringify(currentJson, null, 2).slice(0, 8000)}
====================================================

Өмнөх чат:
${historyBlock}

Багшийн шинэ хүсэлт:
${userMessage}

ЗААВАР:
- Багшийн хүсэлтийг ойлгож, зөвхөн хэрэгтэй талбарыг л өөрчилнө. БУСАД талбарыг ХЭВЭЭР үлдээнэ.
- "updated" талбарт БҮТЭН шинэчилсэн объектыг (одоо байгаа схемийн дагуу) буцаа.
- Хэрэв багш зөвхөн асуулт асуусан, эсвэл өөрчлөлт хэрэггүй гэсэн бол "updated" нь null байх ба "reply" дотор хариулна.
- "reply" дотор юу өөрчилсөн, эсвэл асуултын хариуг 1-3 өгүүлбэрээр МОНГОЛ хэлээр товч бичнэ.
- ID, subjectId, createdAt зэрэг систем талбарыг ӨӨРЧЛӨХГҮЙ.

JSON формат (зөвхөн энэ):
{
  "reply": "Товч хариу/тайлбар",
  "updated": { ... шинэчилсэн объект ... } | null
}`);
  const result = JSON.parse(jsonStr);
  return { reply: result.reply || "", updated: result.updated ?? null };
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
