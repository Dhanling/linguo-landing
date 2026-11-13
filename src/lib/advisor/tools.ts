// [ai-funnel-v1] Registri tool bersama: SATU definisi dipakai dua kanal —
// function calling Konsultan AI (/api/advisor) dan MCP server (/api/mcp).
// Nama & deskripsi berbahasa Inggris supaya mudah dipahami model mana pun.
// Validasi input ditulis manual (repo ini tidak memakai zod) dan ketat:
// tool dipanggil oleh model/klien luar, jangan percaya bentuk argumennya.

import {
  listLanguages,
  searchPrograms,
  getProgramDetails,
  WA_ADMIN_URL,
  BASE_URL,
} from "./catalog";
import { estimateLearningPlan, placementTestLink } from "./plan";
import { saveLead, type AdvisorChannel } from "./leads";

type JsonSchema = Record<string, unknown>;

export type ToolContext = {
  channel: AdvisorChannel;
  sessionId: string | null;
  ip: string;
  /** [ai-kanal-v1] Klien MCP / sumber AI pengunjung — ikut ke lead & event. */
  via?: string | null;
};

export type AdvisorTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  readOnly: boolean;
  /** Kanal yang boleh memakai tool ini. */
  channels: AdvisorChannel[];
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};

export class ToolInputError extends Error {}

const str = (a: Record<string, unknown>, k: string, opts: { required?: boolean; max?: number } = {}) => {
  const v = a[k];
  if (v == null || v === "") {
    if (opts.required) throw new ToolInputError(`"${k}" is required`);
    return null;
  }
  if (typeof v !== "string" && typeof v !== "number") throw new ToolInputError(`"${k}" must be a string`);
  const s = String(v).trim();
  if (opts.required && !s) throw new ToolInputError(`"${k}" is required`);
  return s.slice(0, opts.max ?? 200);
};
const num = (a: Record<string, unknown>, k: string, opts: { required?: boolean; min?: number; max?: number } = {}) => {
  const v = a[k];
  if (v == null || v === "") {
    if (opts.required) throw new ToolInputError(`"${k}" is required`);
    return null;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) throw new ToolInputError(`"${k}" must be a number`);
  if (opts.min != null && n < opts.min) throw new ToolInputError(`"${k}" must be >= ${opts.min}`);
  if (opts.max != null && n > opts.max) throw new ToolInputError(`"${k}" must be <= ${opts.max}`);
  return n;
};

const LEVEL_DESC = "CEFR level: A1, A2, B1 or B2 (sublevel like A2.3 is accepted).";
const FORMAT_ENUM = ["private", "semi-private", "reguler", "kids", "test-prep"];

export const ADVISOR_TOOLS: AdvisorTool[] = [
  {
    name: "list_languages",
    title: "List Linguo languages",
    description:
      "List every language taught at Linguo.id (online language school, Indonesia) with the CEFR levels offered and links to the course page, syllabus, placement test and registration.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    readOnly: true,
    channels: ["web", "mcp"],
    run: async () => {
      const langs = listLanguages();
      return {
        count: langs.length,
        levels_offered: "A1–B2 (CEFR)",
        languages: langs.map((l) => ({
          id: l.id,
          name_id: l.name,
          name_en: l.nameEn,
          native_name: l.nativeName,
          course_page: l.landingUrl,
          syllabus: l.syllabusUrl,
          placement_test: l.placementTestUrl,
          register: l.registerUrl,
          group_class_available: l.regulerAvailable,
          native_teacher_available: l.nativeTeacherAvailable,
        })),
      };
    },
  },
  {
    name: "search_programs",
    title: "Search Linguo programs",
    description:
      "Find Linguo class programs for a language, with official prices in IDR. Optional filters: CEFR level, format (private, semi-private, reguler = group class, kids, test-prep) and maximum budget per session (or per package for flat-priced programs).",
    inputSchema: {
      type: "object",
      properties: {
        language: { type: "string", description: "Language name in English or Indonesian, e.g. Japanese / Jepang." },
        level: { type: "string", description: LEVEL_DESC },
        format: { type: "string", enum: FORMAT_ENUM },
        max_budget_idr: { type: "number", description: "Maximum price in IDR." },
      },
      required: ["language"],
      additionalProperties: false,
    },
    readOnly: true,
    channels: ["web", "mcp"],
    run: async (a) => {
      const r = searchPrograms({
        language: str(a, "language", { required: true, max: 60 })!,
        level: str(a, "level", { max: 6 }),
        format: str(a, "format", { max: 20 }),
        max_budget_idr: num(a, "max_budget_idr", { min: 0, max: 1e9 }),
      });
      if (!r.language)
        return { found: false, message: "Language not found. Call list_languages to see available languages." };
      return {
        found: true,
        language: r.language.name,
        currency: "IDR",
        programs: r.programs,
        note: r.programs.length ? null : `No program matches the filters. Contact admin: ${WA_ADMIN_URL}`,
      };
    },
  },
  {
    name: "get_program_details",
    title: "Get program details",
    description:
      "Get full details and per-level prices (IDR) of one program by program_id as returned by search_programs, e.g. 'private:japanese', 'semi-private:korean', 'ielts-toefl'.",
    inputSchema: {
      type: "object",
      properties: { program_id: { type: "string" } },
      required: ["program_id"],
      additionalProperties: false,
    },
    readOnly: true,
    channels: ["web", "mcp"],
    run: async (a) => {
      const p = getProgramDetails(str(a, "program_id", { required: true, max: 60 })!);
      return p ? { found: true, program: p } : { found: false, message: "Unknown program_id. Use search_programs first." };
    },
  },
  {
    name: "estimate_learning_plan",
    title: "Estimate learning plan",
    description:
      "Deterministic study plan: number of sessions per CEFR level, estimated duration in weeks/months, exam equivalence (JLPT/TOPIK/HSK/etc. when known) and estimated cost in IDR, based on Linguo's curriculum (16 sessions per sublevel). Always use this instead of estimating numbers yourself.",
    inputSchema: {
      type: "object",
      properties: {
        language: { type: "string" },
        current_level: {
          type: "string",
          description: "Level already mastered. Use 'none' for complete beginners. " + LEVEL_DESC,
        },
        target_level: { type: "string", description: LEVEL_DESC },
        hours_per_week: { type: "number", description: "Study hours per week, 1–30." },
        goal: { type: "string", description: "Learner goal, e.g. work in Japan, master's degree in Germany, hobby, exam." },
        format: { type: "string", enum: ["private", "semi-private", "reguler"] },
      },
      required: ["language", "current_level", "target_level", "hours_per_week"],
      additionalProperties: false,
    },
    readOnly: true,
    channels: ["web", "mcp"],
    run: async (a) =>
      estimateLearningPlan({
        language: str(a, "language", { required: true, max: 60 })!,
        current_level: str(a, "current_level", { max: 10 }),
        target_level: str(a, "target_level", { required: true, max: 10 })!,
        hours_per_week: num(a, "hours_per_week", { required: true, min: 0.5, max: 30 })!,
        goal: str(a, "goal", { max: 200 }),
        format: str(a, "format", { max: 20 }),
      }),
  },
  {
    name: "get_placement_test_link",
    title: "Get placement test link",
    description: "Get the free online placement test link for a language (result: estimated CEFR level).",
    inputSchema: {
      type: "object",
      properties: { language: { type: "string" } },
      required: ["language"],
      additionalProperties: false,
    },
    readOnly: true,
    channels: ["web", "mcp"],
    run: async (a) => placementTestLink(str(a, "language", { required: true, max: 60 })!),
  },
  {
    name: "request_trial",
    title: "Request a trial class",
    description:
      "Submit a trial-class request to Linguo admins on behalf of the user. Only call this after the user explicitly agrees and provides their name and WhatsApp number. Does NOT process payment; an admin will contact the user on WhatsApp.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        whatsapp: { type: "string", description: "WhatsApp number, Indonesian format accepted (08…, +62…)." },
        language: { type: "string" },
        preferred_schedule: { type: "string", description: "Free text, e.g. weekday evenings." },
        notes: { type: "string", description: "Goal, current level or anything the admin should know." },
      },
      required: ["name", "whatsapp", "language"],
      additionalProperties: false,
    },
    readOnly: false,
    channels: ["mcp"],
    run: async (a, ctx) => {
      const r = await saveLead({
        channel: ctx.channel,
        name: str(a, "name", { required: true, max: 80 })!,
        whatsapp: str(a, "whatsapp", { required: true, max: 25 })!,
        language: str(a, "language", { required: true, max: 60 }),
        program: "Trial",
        schedule: str(a, "preferred_schedule", { max: 200 }),
        notes: str(a, "notes", { max: 400 }),
        sessionId: ctx.sessionId,
        via: ctx.via ?? null,
      });
      if (!r.ok) return { ok: false, message: r.error };
      return {
        ok: true,
        duplicate: r.duplicate,
        message: r.duplicate
          ? "This WhatsApp number already submitted a request in the last 24 hours. A Linguo admin will contact it on WhatsApp."
          : "Trial request received. A Linguo admin will contact the user on WhatsApp. No payment has been made.",
        message_id: "Permintaan trial diterima. Admin Linguo akan menghubungi lewat WhatsApp.",
        admin_whatsapp: WA_ADMIN_URL,
        website: BASE_URL,
      };
    },
  },
];

export function toolsFor(channel: AdvisorChannel): AdvisorTool[] {
  return ADVISOR_TOOLS.filter((t) => t.channels.includes(channel));
}

/** Format OpenAI-compatible (DeepSeek dkk) untuk function calling. */
export function openAiToolSpecs(channel: AdvisorChannel) {
  return toolsFor(channel).map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));
}

export async function runTool(
  name: string,
  args: unknown,
  ctx: ToolContext,
): Promise<{ ok: boolean; result: unknown }> {
  const tool = toolsFor(ctx.channel).find((t) => t.name === name);
  if (!tool) return { ok: false, result: { error: `Unknown tool: ${name}` } };
  const a = args && typeof args === "object" && !Array.isArray(args) ? (args as Record<string, unknown>) : {};
  try {
    return { ok: true, result: await tool.run(a, ctx) };
  } catch (e) {
    if (e instanceof ToolInputError) return { ok: false, result: { error: e.message } };
    console.error(`[advisor] tool ${name} error:`, e);
    return { ok: false, result: { error: "Internal error" } };
  }
}
