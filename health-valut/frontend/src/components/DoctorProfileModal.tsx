import { FormEvent, useState } from "react";
import { X, Stethoscope, Building2, Award, Phone, IndianRupee, FileText } from "lucide-react";
import { api } from "../api/client";
import { Doctor } from "../types";
import { useAuth } from "../context/AuthContext";

interface Props {
  doctor: Doctor;
  onClose: () => void;
  onSaved: (d: Doctor) => void;
}

export default function DoctorProfileModal({ doctor, onClose, onSaved }: Props) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: doctor?.name || "",
    specialization: doctor?.specialization || "General Physician",
    qualification: doctor?.qualification || "",
    experienceYears: doctor?.experienceYears != null ? String(doctor.experienceYears) : "",
    clinicName: doctor?.clinicName || "",
    location: doctor?.location || "",
    phone: doctor?.phone || "",
    consultationFee: doctor?.consultationFee != null ? String(doctor.consultationFee) : "",
    biography: doctor?.biography || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : null,
      };
      const res = await api.put("/doctors/me", payload);
      await refreshUser();
      onSaved(res.data.doctor);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update doctor profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="card p-5 sm:p-7 w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white my-auto shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-vault-line mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-primaryLight flex items-center justify-center text-vault-primary">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-vault-ink">Edit Doctor Profile</h3>
              <p className="text-xs text-vault-muted">Manage clinical details, fees & clinic contact information</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Doctor Name *</label>
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. Meera Iyer"
              />
            </div>
            <div>
              <label className="label">Specialization *</label>
              <input
                required
                className="input"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g. Cardiologist / General Physician"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Medical Qualification</label>
              <input
                className="input"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="e.g. MBBS, MD, DM"
              />
            </div>
            <div>
              <label className="label">Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="60"
                className="input"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                placeholder="e.g. 10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Clinic / Hospital Name</label>
              <input
                className="input"
                value={form.clinicName}
                onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                placeholder="e.g. Apollo Spectra / Sunrise Clinic"
              />
            </div>
            <div>
              <label className="label">Clinic City / Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Koramangala, Bengaluru"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Direct / Clinic Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +91 9876543210"
              />
            </div>
            <div>
              <label className="label">Consultation Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                className="input"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                placeholder="e.g. 600"
              />
            </div>
          </div>

          <div>
            <label className="label">Biography & Clinical Focus</label>
            <textarea
              className="input"
              rows={3}
              value={form.biography}
              onChange={(e) => setForm({ ...form, biography: e.target.value })}
              placeholder="Brief summary of your clinical practice, areas of expertise, and patient approach..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-vault-line">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
              {saving ? "Saving Changes..." : "Save Doctor Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
