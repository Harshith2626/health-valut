import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";
import { aiAssistantReply, aiExplainReport, aiAnalyzePrescription, aiHealthSummary, aiDoctorClinicalSummary, AI_DEMO_MODE } from "../utils/ai";

const router = Router();

router.get("/status", requireAuth, (_req, res) => {
  res.json({ demoMode: AI_DEMO_MODE });
});

// ---------- 12. AI Health Assistant (general Q&A, conversational, persisted) ----------

router.get("/assistant/conversations", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });
    const conversations = await prisma.aIConversation.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

router.get("/assistant/conversations/:id/messages", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: "asc" },
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/assistant  { message, conversationId? }
router.post("/assistant", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const { message, conversationId } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    let conversation = conversationId
      ? await prisma.aIConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: { patientId: patient.id, title: message.slice(0, 60) },
      });
    }

    const history = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    await prisma.aIMessage.create({ data: { conversationId: conversation.id, role: "user", content: message } });

    const { reply, demo } = await aiAssistantReply(message, history.map((h: any) => ({ role: h.role, content: h.content })));

    await prisma.aIMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });

    res.json({ conversationId: conversation.id, reply, demo });
  } catch (err) {
    next(err);
  }
});

// ---------- 13. AI Prescription Analyzer ----------
// body: { prescriptionText }  (text pasted from / describing the uploaded prescription)
router.post("/analyze-prescription", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const { prescriptionText } = req.body;
    if (!prescriptionText) return res.status(400).json({ error: "prescriptionText is required" });
    const result = await aiAnalyzePrescription(prescriptionText);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------- 14. AI Medical Report Explainer ----------
// body: { reportText }
router.post("/explain-report", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const { reportText } = req.body;
    if (!reportText) return res.status(400).json({ error: "reportText is required" });
    const result = await aiExplainReport(reportText);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------- 15. AI Patient Health Summary (For Patients) ----------
router.get("/health-summary", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const [history, records, prescriptions] = await Promise.all([
      prisma.medicalHistoryEvent.findMany({ where: { patientId: patient.id }, orderBy: { eventDate: "desc" }, take: 15 }),
      prisma.medicalRecord.findMany({ where: { patientId: patient.id }, orderBy: { eventDate: "desc" }, take: 15 }),
      prisma.prescription.findMany({ where: { patientId: patient.id }, include: { medicines: true }, orderBy: { issuedAt: "desc" }, take: 10 }),
    ]);

    const bmi = patient.height && patient.weight
      ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
      : null;

    const profileSummary = `
Patient: ${patient.name}, Gender: ${patient.gender || "unspecified"}, Blood group: ${patient.bloodGroup || "unknown"}
Height: ${patient.height ? `${patient.height} cm` : "Not provided"}, Weight: ${patient.weight ? `${patient.weight} kg` : "Not provided"}${bmi ? `, BMI: ${bmi}` : ""}
Allergies: ${patient.allergies || "none listed"}
Existing conditions: ${patient.existingConditions || "none listed"}
Current medications: ${patient.currentMedications || "none listed"}

Recent history events:
${history.map((h: any) => `- ${h.eventDate.toISOString().slice(0, 10)}: ${h.eventType} — ${h.title}${h.description ? ` (${h.description})` : ""}`).join("\n") || "none"}

Recent records:
${records.map((r: any) => `- ${r.eventDate.toISOString().slice(0, 10)}: ${r.recordType} — ${r.title}${r.description ? ` (${r.description})` : ""}`).join("\n") || "none"}

Recent prescriptions:
${prescriptions.map((p: any) => `- ${p.issuedAt.toISOString().slice(0, 10)}: ${p.medicines.map((m: any) => `${m.name} (${m.dosage || ""}, ${m.frequency || ""})`).join(", ")}`).join("\n") || "none"}
`.trim();

    const result = await aiHealthSummary(profileSummary);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------- 16. AI Clinical Summary (1-Click for Doctors Viewing Authorized Patient) ----------
router.get("/doctor-summary/:patientId", requireAuth, requireRole("DOCTOR"), async (req: AuthRequest, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.userId } });
    if (!doctor) return res.status(404).json({ error: "Doctor profile not found" });

    const grant = await prisma.recordAccess.findFirst({
      where: { doctorId: doctor.id, patientId: req.params.patientId, revokedAt: null },
    });
    if (!grant) {
      return res.status(403).json({ error: "You are not authorized to access AI clinical summaries for this patient" });
    }

    const patient = await prisma.patient.findUnique({ where: { id: req.params.patientId } });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const [history, records, prescriptions] = await Promise.all([
      grant.allRecords || grant.medicalHistory
        ? prisma.medicalHistoryEvent.findMany({ where: { patientId: patient.id }, orderBy: { eventDate: "desc" }, take: 15 })
        : [],
      prisma.medicalRecord.findMany({
        where: {
          patientId: patient.id,
          ...(grant.allRecords
            ? {}
            : {
                OR: [
                  ...(grant.labReports ? [{ recordType: { in: ["LAB_REPORT", "BLOOD_TEST"] as any } }] : []),
                  ...(grant.scanReports ? [{ recordType: "SCAN" as any }] : []),
                  ...(grant.hospitalRecords ? [{ recordType: { in: ["HOSPITAL_RECORD", "DISCHARGE_SUMMARY"] as any } }] : []),
                  ...(grant.prescriptions ? [{ recordType: "PRESCRIPTION" as any }] : []),
                ],
              }),
        },
        orderBy: { eventDate: "desc" },
        take: 15,
      }),
      grant.allRecords || grant.prescriptions
        ? prisma.prescription.findMany({ where: { patientId: patient.id }, include: { medicines: true }, orderBy: { issuedAt: "desc" }, take: 10 })
        : [],
    ]);

    const bmi = patient.height && patient.weight
      ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
      : null;

    const patientData = `
Patient: ${patient.name}, DOB: ${patient.dateOfBirth ? patient.dateOfBirth.toISOString().slice(0, 10) : "unspecified"}, Gender: ${patient.gender || "unspecified"}
Blood Group: ${patient.bloodGroup || "unknown"}, Phone: ${patient.phone || "unspecified"}
Height: ${patient.height ? `${patient.height} cm` : "Not provided"}, Weight: ${patient.weight ? `${patient.weight} kg` : "Not provided"}${bmi ? `, BMI: ${bmi}` : ""}
Emergency Contact: ${patient.emergencyContactName || "None"} (${patient.emergencyContactPhone || ""}${patient.emergencyContactRelation ? `, ${patient.emergencyContactRelation}` : ""})
Known Allergies: ${patient.allergies || "None declared"}
Existing Conditions: ${patient.existingConditions || "None declared"}
Current Medications: ${patient.currentMedications || "None declared"}

Authorized Medical History:
${history.map((h: any) => `- ${h.eventDate.toISOString().slice(0, 10)} [${h.eventType}]: ${h.title}${h.description ? ` (${h.description})` : ""}`).join("\n") || "No historical events available"}

Authorized Diagnostic Records & Reports:
${records.map((r: any) => `- ${r.eventDate.toISOString().slice(0, 10)} [${r.recordType}]: ${r.title} ${r.hospital ? `at ${r.hospital}` : ""} ${r.description ? `— ${r.description}` : ""}`).join("\n") || "No records available"}

Authorized Past Prescriptions:
${prescriptions.map((p: any) => `- ${p.issuedAt.toISOString().slice(0, 10)} ${p.diagnosis ? `(Dx: ${p.diagnosis})` : ""}: ${p.medicines.map((m: any) => `${m.name} ${m.dosage || ""} ${m.frequency || ""}`).join(", ")} ${p.notes ? `[Notes: ${p.notes}]` : ""}`).join("\n") || "No prior prescriptions"}
`.trim();

    const result = await aiDoctorClinicalSummary(patientData);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
