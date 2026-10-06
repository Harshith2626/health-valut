import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";
import { logAudit } from "../utils/audit";

const router = Router();

async function getOwnPatient(userId: string) {
  return prisma.patient.findUnique({ where: { userId } });
}

// GET /api/patients/me
router.get("/me", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const patient = await getOwnPatient(req.user!.userId);
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });
    const h = (patient as any).height ?? (patient as any).heightCm;
    const w = (patient as any).weight ?? (patient as any).weightKg;
    res.json({
      patient: {
        ...patient,
        height: h,
        heightCm: h,
        weight: w,
        weightKg: w,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/patients/me
router.put("/me", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const patient = await getOwnPatient(req.user!.userId);
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const {
      name, dateOfBirth, gender, bloodGroup, phone, address,
      allergies, existingConditions, currentMedications,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      avatarUrl,
    } = req.body;

    const effectiveHeight = req.body.height !== undefined ? req.body.height : req.body.heightCm;
    const effectiveWeight = req.body.weight !== undefined ? req.body.weight : req.body.weightKg;

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        name, gender, bloodGroup, phone, address,
        allergies, existingConditions, currentMedications,
        emergencyContactName, emergencyContactPhone, emergencyContactRelation,
        avatarUrl,
        height: effectiveHeight === null || effectiveHeight === "" ? null : (effectiveHeight !== undefined && !isNaN(Number(effectiveHeight)) ? Number(effectiveHeight) : undefined),
        weight: effectiveWeight === null || effectiveWeight === "" ? null : (effectiveWeight !== undefined && !isNaN(Number(effectiveWeight)) ? Number(effectiveWeight) : undefined),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : (dateOfBirth === null || dateOfBirth === "" ? null : undefined),
      },
    });

    await logAudit(req.user!.userId, "PATIENT_PROFILE_UPDATED");
    const h = (updated as any).height ?? (updated as any).heightCm;
    const w = (updated as any).weight ?? (updated as any).weightKg;
    res.json({
      patient: {
        ...updated,
        height: h,
        heightCm: h,
        weight: w,
        weightKg: w,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/me/emergency-overview — condensed emergency view
router.get("/me/emergency-overview", requireAuth, requireRole("PATIENT"), async (req: AuthRequest, res, next) => {
  try {
    const patient = await getOwnPatient(req.user!.userId);
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const recentHistory = await prisma.medicalHistoryEvent.findMany({
      where: { patientId: patient.id },
      orderBy: { eventDate: "desc" },
      take: 5,
    });

    const bmi = patient.height && patient.weight
      ? Number((patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1))
      : null;

    res.json({
      overview: {
        name: patient.name,
        bloodGroup: patient.bloodGroup,
        height: patient.height,
        weight: patient.weight,
        bmi,
        allergies: patient.allergies,
        majorConditions: patient.existingConditions,
        currentMedications: patient.currentMedications,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        emergencyContactRelation: patient.emergencyContactRelation,
        recentEvents: recentHistory,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
