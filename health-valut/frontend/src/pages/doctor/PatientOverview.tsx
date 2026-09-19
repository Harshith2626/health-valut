import { FormEvent, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format, differenceInYears } from "date-fns";
import { ArrowLeft, ShieldAlert, Upload, Sparkles, Copy, Check, RotateCw, Activity, Phone, Scale } from "lucide-react";
import { api, fileUrl } from "../../api/client";
import { Card, EmptyState, SectionHeading, Spinner } from "../../components/UI";
import { calculateBMI, evaluateHealthStatus } from "../../utils/health";

export default function PatientOverview() {
  const { patientId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // AI Clinical Summary State
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);

  function load() {
    return api
      .get(`/authorization/patient-overview/${patientId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load this patient's overview."));
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function generateAiSummary() {
    setAiLoading(true);
    try {
      const res = await api.get(`/ai/doctor-summary/${patientId}`);
      setAiSummary(res.data.summary);
    } catch (err: any) {
      setAiSummary("Failed to generate AI summary. Ensure you have authorized access to this patient's records.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleCopy() {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 2000);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  if (error) {
    return (
      <Card>
        <EmptyState icon={<ShieldAlert className="w-8 h-8" />} title="Access not authorized" description={error} />
      </Card>
    );
  }

  const { patient, history, records, prescriptions } = data;
  const age = patient.dateOfBirth ? differenceInYears(new Date(), new Date(patient.dateOfBirth)) : null;
  const bmiInfo = calculateBMI(patient.weight, patient.height);
  const healthStatus = evaluateHealthStatus(patient);

  return (
    <div className="space-y-6">
      <Link to="/doctor" className="text-sm text-vault-muted hover:text-vault-primary flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      {/* Patient Header & Vitals Snapshot */}
      <Card className="bg-gradient-to-br from-white to-vault-bg border-vault-line">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-vault-primaryLight flex items-center justify-center text-vault-primary font-display font-semibold text-2xl shadow-sm">
              {patient.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-display font-semibold text-vault-ink">{patient.name}</h1>
                <span className={`badge ${healthStatus.badgeBg} ${healthStatus.textColor} border ${healthStatus.borderColor} text-[11px]`}>
                  {healthStatus.status}
                </span>
              </div>
              <p className="text-xs text-vault-muted mt-0.5">
                {[
                  age ? `${age} yrs` : null,
                  patient.gender,
                  patient.bloodGroup ? `Blood: ${patient.bloodGroup}` : null,
                  patient.phone ? `Ph: ${patient.phone}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpload(true)} className="btn-secondary flex items-center gap-2 text-xs py-2">
              <Upload className="w-3.5 h-3.5" /> Contribute record
            </button>
            <button
              onClick={generateAiSummary}
              disabled={aiLoading}
              className="btn-primary flex items-center gap-2 text-xs py-2 shadow-pop"
            >
              {aiLoading ? <Spinner className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-200" />}
              1-Click AI Briefing
            </button>
          </div>
        </div>

        {/* Vitals and Emergency Info Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-vault-line/80">
          <div className="p-2.5 rounded-xl bg-white border border-vault-line">
            <p className="text-[11px] text-vault-muted flex items-center gap-1">
              <Scale className="w-3 h-3 text-vault-primary" /> Body Vitals
            </p>
            <p className="text-xs font-semibold text-vault-ink mt-0.5">
              {patient.height ? `${patient.height} cm` : "—"} / {patient.weight ? `${patient.weight} kg` : "—"}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-vault-line">
            <p className="text-[11px] text-vault-muted flex items-center gap-1">
              <Activity className="w-3 h-3 text-vault-primary" /> BMI Score
            </p>
            <p className="text-xs font-semibold text-vault-ink mt-0.5">
              {bmiInfo ? (
                <span className="flex items-center gap-1">
                  <span>{bmiInfo.bmi}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${bmiInfo.badgeBg} ${bmiInfo.textColor}`}>
                    {bmiInfo.category}
                  </span>
                </span>
              ) : (
                "—"
              )}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-vault-line">
            <p className="text-[11px] text-vault-muted flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-500" /> Allergies
            </p>
            <p className="text-xs font-semibold text-vault-ink mt-0.5 truncate">
              {patient.allergies || "None declared"}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-vault-line">
            <p className="text-[11px] text-vault-muted flex items-center gap-1">
              <Phone className="w-3 h-3 text-vault-primary" /> Emergency Contact
            </p>
            <p className="text-xs font-semibold text-vault-ink mt-0.5 truncate">
              {patient.emergencyContactName ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || ""})` : "—"}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-3 text-xs">
          <div>
            <p className="text-vault-muted font-medium mb-0.5">Existing Conditions:</p>
            <p className="text-vault-ink">{patient.existingConditions || "None listed"}</p>
          </div>
          <div>
            <p className="text-vault-muted font-medium mb-0.5">Current Medications:</p>
            <p className="text-vault-ink">{patient.currentMedications || "None listed"}</p>
          </div>
        </div>
      </Card>

      {/* 1-Click AI Clinical Summary Section */}
      <Card className="border-vault-primary/30 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-vault-line">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-vault-primaryLight flex items-center justify-center text-vault-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-vault-ink">AI Clinical Briefing</h3>
              <p className="text-xs text-vault-muted">1-click aggregated clinical digest of baseline, records, labs & prescriptions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {aiSummary && (
              <>
                <button
                  onClick={handleCopy}
                  className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
                  title="Copy clinical summary"
                >
                  {aiCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {aiCopied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={generateAiSummary}
                  disabled={aiLoading}
                  className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
                  title="Regenerate"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
              </>
            )}
          </div>
        </div>

        {aiLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <Spinner className="w-7 h-7 text-vault-primary" />
            <p className="text-xs text-vault-muted font-medium">Aggregating patient history, records & generating clinical briefing...</p>
          </div>
        ) : aiSummary ? (
          <div className="pt-4 text-xs sm:text-sm text-vault-ink leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-xl border border-vault-line mt-3">
            {aiSummary}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-xs text-vault-muted mb-3">
              Click below to generate a concise, structured clinical briefing synthesized from this patient's authorized records.
            </p>
            <button
              onClick={generateAiSummary}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" /> Generate AI Clinical Summary
            </button>
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeading title="Medical history" />
          {history.length === 0 ? (
            <p className="text-sm text-vault-muted">No history authorized or recorded.</p>
          ) : (
            <div className="vault-thread space-y-5 pl-6">
              {history.map((h: any) => (
                <div key={h.id} className="vault-node">
                  <p className="text-xs font-mono text-vault-muted">{format(new Date(h.eventDate), "MMM d, yyyy")}</p>
                  <p className="text-sm font-medium">{h.title}</p>
                  {h.description && <p className="text-xs text-vault-muted mt-0.5">{h.description}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeading title="Authorized records" />
          {records.length === 0 ? (
            <p className="text-sm text-vault-muted">No records authorized.</p>
          ) : (
            <div className="space-y-3">
              {records.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-vault-muted">{format(new Date(r.eventDate), "MMM d, yyyy")}</p>
                  </div>
                  {r.fileUrl && <a href={fileUrl(r.fileUrl)} target="_blank" rel="noreferrer" className="text-xs text-vault-primary font-medium">View</a>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeading title="Prescriptions" />
        {prescriptions.length === 0 ? (
          <p className="text-sm text-vault-muted">No prescriptions authorized or issued yet.</p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((p: any) => (
              <div key={p.id} className="text-sm border-b border-vault-line last:border-0 pb-3 last:pb-0">
                <p className="font-medium">{format(new Date(p.issuedAt), "MMM d, yyyy")} {p.diagnosis ? `· ${p.diagnosis}` : ""}</p>
                <p className="text-xs text-vault-muted">{p.medicines.map((m: any) => m.name).join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showUpload && <ContributeModal patientId={patientId!} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); load(); }} />}
    </div>
  );
}

function ContributeModal({ patientId, onClose, onDone }: { patientId: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ recordType: "CONSULTATION_REPORT", title: "", eventDate: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("file", file);
      await api.post(`/records/doctor-upload/${patientId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onDone();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't add this record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display font-semibold text-lg mb-4">Contribute a record</h3>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.recordType} onChange={(e) => setForm({ ...form, recordType: e.target.value })}>
                <option value="CONSULTATION_REPORT">Consultation Report</option>
                <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                <option value="LAB_REPORT">Lab Report</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" required className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Document</label>
            <input type="file" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {error && <p className="text-sm text-vault-coral">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Add record"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
