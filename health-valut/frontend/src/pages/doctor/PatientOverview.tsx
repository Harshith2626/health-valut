import { FormEvent, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, ShieldAlert, Upload } from "lucide-react";
import { api, fileUrl } from "../../api/client";
import { Card, EmptyState, SectionHeading, Spinner } from "../../components/UI";

export default function PatientOverview() {
  const { patientId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

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

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  if (error) {
    return (
      <Card>
        <EmptyState icon={<ShieldAlert className="w-8 h-8" />} title="Access not authorized" description={error} />
      </Card>
    );
  }

  const { patient, history, records, prescriptions } = data;

  return (
    <div className="space-y-6">
      <Link to="/doctor" className="text-sm text-vault-muted hover:text-vault-primary flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-vault-primaryLight flex items-center justify-center text-vault-primary font-display font-semibold text-xl">
              {patient.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold">{patient.name}</h1>
              <p className="text-sm text-vault-muted">Blood group: {patient.bloodGroup || "—"}</p>
            </div>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Contribute record
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-vault-line text-sm">
          <div><p className="text-xs text-vault-muted mb-1">Allergies</p><p>{patient.allergies || "None listed"}</p></div>
          <div><p className="text-xs text-vault-muted mb-1">Existing conditions</p><p>{patient.existingConditions || "None listed"}</p></div>
          <div><p className="text-xs text-vault-muted mb-1">Current medications</p><p>{patient.currentMedications || "None listed"}</p></div>
        </div>
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
