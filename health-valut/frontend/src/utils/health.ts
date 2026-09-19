import { Patient } from "../types";

export interface BMIResult {
  bmi: number;
  category: "Underweight" | "Normal Weight" | "Overweight" | "Obese";
  badgeBg: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export function calculateBMI(weightKg?: number | string | null, heightCm?: number | string | null): BMIResult | null {
  const numWeight = typeof weightKg === "number" ? weightKg : parseFloat(String(weightKg || ""));
  const numHeight = typeof heightCm === "number" ? heightCm : parseFloat(String(heightCm || ""));

  if (!numWeight || !numHeight || isNaN(numWeight) || isNaN(numHeight) || numWeight <= 0 || numHeight <= 0) {
    return null;
  }

  const heightM = numHeight / 100;
  const bmiRaw = numWeight / (heightM * heightM);
  const bmi = Number(bmiRaw.toFixed(1));

  if (bmi < 18.5) {
    return {
      bmi,
      category: "Underweight",
      badgeBg: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      description: "Below standard recommended range. Ensure balanced nutrition & consult doctor if unintended weight loss occurs.",
    };
  } else if (bmi <= 24.9) {
    return {
      bmi,
      category: "Normal Weight",
      badgeBg: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
      description: "Optimal BMI range. Maintain regular activity and a balanced diet.",
    };
  } else if (bmi <= 29.9) {
    return {
      bmi,
      category: "Overweight",
      badgeBg: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      description: "Slightly elevated. Moderate aerobic exercise and balanced nutrition can support healthy maintenance.",
    };
  } else {
    return {
      bmi,
      category: "Obese",
      badgeBg: "bg-rose-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
      description: "Elevated risk for metabolic & cardiovascular conditions. Recommended to discuss lifestyle plan with your physician.",
    };
  }
}

export interface HealthStatusResult {
  status: string;
  level: "optimal" | "stable" | "attention" | "warning" | "incomplete";
  badgeBg: string;
  textColor: string;
  borderColor: string;
  headline: string;
  summary: string;
  metricsScore: number; // 0 to 100
  insights: string[];
}

export function evaluateHealthStatus(patient?: Patient | null): HealthStatusResult {
  if (!patient) {
    return {
      status: "Profile Incomplete",
      level: "incomplete",
      badgeBg: "bg-slate-100",
      textColor: "text-slate-700",
      borderColor: "border-slate-300",
      headline: "Complete your health profile to enable status analysis",
      summary: "Add your height, weight, blood group, and emergency contacts.",
      metricsScore: 20,
      insights: ["Profile data is needed to assess health status."],
    };
  }

  const bmiInfo = calculateBMI(patient.weight, patient.height);
  const hasConditions = Boolean(patient.existingConditions && patient.existingConditions.trim() && patient.existingConditions.toLowerCase() !== "none");
  const hasAllergies = Boolean(patient.allergies && patient.allergies.trim() && patient.allergies.toLowerCase() !== "none");
  const hasMeds = Boolean(patient.currentMedications && patient.currentMedications.trim() && patient.currentMedications.toLowerCase() !== "none");
  const hasEmergency = Boolean(patient.emergencyContactPhone && patient.emergencyContactName);
  const hasBlood = Boolean(patient.bloodGroup);

  const insights: string[] = [];

  if (bmiInfo) {
    insights.push(`BMI is ${bmiInfo.bmi} (${bmiInfo.category})`);
  } else {
    insights.push("Height & weight not provided for BMI calculation");
  }

  if (hasConditions) {
    insights.push(`Active condition: ${patient.existingConditions}`);
  } else {
    insights.push("No chronic conditions listed");
  }

  if (hasAllergies) {
    insights.push(`⚠️ Allergy flag: ${patient.allergies}`);
  }

  if (hasMeds) {
    insights.push(`Current medications: ${patient.currentMedications}`);
  }

  if (!hasEmergency) {
    insights.push("⚠️ Emergency contact details are incomplete");
  }

  // Determine Level & Score
  let score = 100;
  if (!bmiInfo) score -= 15;
  if (!hasEmergency) score -= 15;
  if (!hasBlood) score -= 10;
  if (bmiInfo && (bmiInfo.category === "Overweight" || bmiInfo.category === "Underweight")) score -= 10;
  if (bmiInfo && bmiInfo.category === "Obese") score -= 25;
  if (hasConditions) score -= 15;

  score = Math.max(20, Math.min(100, score));

  if (!patient.height || !patient.weight || !hasBlood || !hasEmergency) {
    return {
      status: "Profile Gaps",
      level: "incomplete",
      badgeBg: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
      headline: "Health metrics incomplete",
      summary: "Add your vital measurements and emergency contact so your doctors have crucial information ready in consultations or emergencies.",
      metricsScore: score,
      insights,
    };
  }

  if (bmiInfo && bmiInfo.category === "Obese") {
    return {
      status: "Attention Recommended",
      level: "attention",
      badgeBg: "bg-rose-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
      headline: "Elevated BMI & metabolic attention",
      summary: "Your BMI is in the elevated range. Regular cardiovascular checkups, balanced nutrition, and physician guidance are advised.",
      metricsScore: score,
      insights,
    };
  }

  if (hasConditions || (bmiInfo && (bmiInfo.category === "Overweight" || bmiInfo.category === "Underweight"))) {
    return {
      status: "Monitored & Stable",
      level: "stable",
      badgeBg: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      headline: "Active management & monitored health",
      summary: "Your health records are actively tracked. Continue taking prescribed medications consistently and keep follow-up appointments.",
      metricsScore: score,
      insights,
    };
  }

  return {
    status: "Optimal Health",
    level: "optimal",
    badgeBg: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    headline: "Vitals and profile in healthy range",
    summary: "Your BMI, baseline profile, and emergency records are in order. Keep up your preventive health routines.",
    metricsScore: score,
    insights,
  };
}
