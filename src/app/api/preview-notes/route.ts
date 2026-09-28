import { NextRequest, NextResponse } from "next/server";
import { previewStudentId, serviceRest } from "@/lib/previewSession";

// ── [lingnote-pratinjau-v1] Lingnote untuk mode pratinjau POV siswa ─────────
// Pratinjau tidak punya sesi login, sedangkan student_notes/student_tasks
// dijaga RLS `student_id = current_student_id()` → dari klien bukunya selalu
// kosong walau siswanya punya catatan. Diambil service role di sini, dikunci ke
// SATU siswa oleh cookie pratinjau, dan hanya-baca (tak ada route tulis).

export const dynamic = "force-dynamic";

const NOTE_COLS =
  "id,student_id,registration_id,session_number,title,content,icon,color,tags,attachments,pinned,shared_with_teacher,archived_at,created_at,updated_at";
const TASK_COLS =
  "id,student_id,registration_id,note_id,title,detail,due_date,done,done_at,source,order_index,created_at,updated_at";

export async function GET(req: NextRequest) {
  const student = req.nextUrl.searchParams.get("student");
  if (!student || !/^[0-9a-f-]{36}$/i.test(student)) {
    return NextResponse.json({ error: "invalid student" }, { status: 400 });
  }
  const allowed = await previewStudentId(req);
  if (!allowed || allowed !== student) {
    return NextResponse.json({ error: "preview session required" }, { status: 403 });
  }

  const [notes, tasks] = await Promise.all([
    serviceRest(`student_notes?select=${NOTE_COLS}&student_id=eq.${student}&archived_at=is.null&order=pinned.desc,updated_at.desc`),
    serviceRest(`student_tasks?select=${TASK_COLS}&student_id=eq.${student}&order=done.asc,due_date.asc.nullslast,created_at.desc`),
  ]);
  return NextResponse.json({ notes: notes ?? [], tasks: tasks ?? [] });
}
