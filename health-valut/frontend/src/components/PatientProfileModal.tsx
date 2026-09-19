import { FormEvent, useState } from "react";
import { X, User, HeartPulse, ShieldAlert, Activity, Phone, Scale } from "lucide-react";
import { api } from "../api/client";
import { Patient } from "../types";
import { calculateBMI } from "../utils/health";
import { useAuth } from "../context/AuthContext";

interface Props {
  patient: Patient;
  onClose: () => void;
  onSaved: (p: Patient) => void;
}

export default function PatientProfileModal({ patient, onClose, onSaved }: Props) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: patient?.name || "",
    gender: patient?.gender || "",
    bloodGroup: patient?.bloodGroup || "",
    dateOfBirth: patient?.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "",
    phone: patient?.phone || "",
    address: patient?.address || "",
    height: patient?.height != null ? String(patient.height) : "",
    weight: patient?.weight != null ? String(patient.weight) : "",
    allergies: patient?.allergies || "",
    existingConditions: patient?.existingConditions || "",
    currentMedications: patient?.currentMedications || "",
    emergencyContactName: patient?.emergencyContactName || "",
    emergencyContactPhone: patient?.emergencyContactPhone || "",
    emergencyContactRelation: patient?.emergencyContactRelation || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const numHeight = parseFloat(form.height);
  const numWeight = parseFloat(form.weight);
  const liveBmi = calculateBMI(numWeight, numHeight);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        height: form.height && !isNaN(parseFloat(form.height)) ? parseFloat(form.height) : null,
        weight: form.weight && !isNaN(parseFloat(form.weight)) ? parseFloat(form.weight) : null,
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth : null,
      };
      const res = await api.put("/patients/me", payload);
      await refreshUser();
      onSaved(res.data.patient);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile. Please check the values.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="card p-5 sm:p-7 w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white my-auto shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-vault-line mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-primaryLight flex items-center justify-center text-vault-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-vault-ink">Edit Health Profile</h3>
              <p className="text-xs text-vault-muted">Manage personal vitals, emergency contacts & baseline records</p>
            </div>
          </div>
          <button onClick={onClose} className="text-vault-muted hover:text-vault-ink p-1.5 rounded-lg hover:bg-vault-bg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-vault-coralLight/60 border border-vault-coral/30 text-vault-coral text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-vault-primary flex items-center gap-1.5 font-semibold">
              <User className="w-3.5 h-3.5" /> 1. Personal & Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Full Name *</label>
                <input
                  required
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Asha Rao"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                />
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input
                  type="date"
                  className="input"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Residential Address</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 104 Greenfield Avenue, Bengaluru"
              />
            </div>
          </div>

          {/* Section 2: Vitals & Body Metrics */}
          <div className="space-y-3 pt-2 border-t border-vault-line">
            <h4 className="text-xs font-mono uppercase tracking-wider text-vault-primary flex items-center gap-1.5 font-semibold">
              <Scale className="w-3.5 h-3.5" /> 2. Body Metrics & Blood Group
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  className="input"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  placeholder="e.g. 170"
                />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="350"
                  className="input"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="e.g. 68"
                />
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select
                  className="input"
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            {/* Live BMI Preview Card */}
            {liveBmi ? (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${liveBmi.badgeBg} ${liveBmi.borderColor}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center font-bold text-sm shadow-sm">
                    <Activity className={`w-5 h-5 ${liveBmi.textColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Calculated BMI: {liveBmi.bmi}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white shadow-xs ${liveBmi.textColor}`}>
                        {liveBmi.category}
                      </span>
                    </div>
                    <p className="text-xs text-vault-ink/70 mt-0.5">{liveBmi.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-vault-muted italic">Enter height and weight above to automatically compute your BMI.</p>
            )}
          </div>

          {/* Section 3: Emergency Contacts */}
          <div className="space-y-3 pt-2 border-t border-vault-line">
            <h4 className="text-xs font-mono uppercase tracking-wider text-vault-primary flex items-center gap-1.5 font-semibold">
              <Phone className="w-3.5 h-3.5" /> 3. Emergency Contacts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Contact Name</label>
                <input
                  className="input"
                  value={form.emergencyContactName}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  placeholder="e.g. Rohan Rao"
                />
              </div>
              <div>
                <label className="label">Contact Phone</label>
                <input
                  className="input"
                  value={form.emergencyContactPhone}
                  onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                  placeholder="e.g. +91 9876500000"
                />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input
                  className="input"
                  value={form.emergencyContactRelation}
                  onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}
                  placeholder="e.g. Spouse / Sibling / Parent"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Baseline */}
          <div className="space-y-3 pt-2 border-t border-vault-line">
            <h4 className="text-xs font-mono uppercase tracking-wider text-vault-primary flex items-center gap-1.5 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" /> 4. Health Conditions & Allergies
            </h4>
            <div>
              <label className="label">Known Allergies (Drugs, Food, Environmental)</label>
              <input
                className="input"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
              />
            </div>
            <div>
              <label className="label">Existing Chronic Conditions</label>
              <input
                className="input"
                value={form.existingConditions}
                onChange={(e) => setForm({ ...form, existingConditions: e.target.value })}
                placeholder="e.g. Mild asthma, Type 2 Diabetes, Hypertension"
              />
            </div>
            <div>
              <label className="label">Current Medications & Dosages</label>
              <textarea
                className="input"
                rows={2}
                value={form.currentMedications}
                onChange={(e) => setForm({ ...form, currentMedications: e.target.value })}
                placeholder="e.g. Metformin 500mg (twice daily), Salbutamol inhaler (as needed)"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-vault-line">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
