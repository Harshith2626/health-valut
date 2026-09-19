import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderLock, CalendarCheck, Pill, BellRing, ArrowRight, AlertTriangle, Activity, Scale, HeartPulse, UserCog, ShieldCheck, Phone } from "lucide-react";
import { api } from "../../api/client";
import { Card, SectionHeading, Spinner } from "../../components/UI";
import { MedicalHistoryEvent, Appointment, Reminder, Patient } from "../../types";
import { calculateBMI, evaluateHealthStatus } from "../../utils/health";
import PatientProfileModal from "../../components/PatientProfileModal";
import { format } from "date-fns";

export default function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [events, setEvents] = useState<MedicalHistoryEvent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  function loadData() {
    return Promise.all([
      api.get("/patients/me"),
      api.get("/history"),
      api.get("/appointments/me"),
      api.get("/reminders"),
    ])
      .then(([p, h, a, r]) => {
        setPatient(p.data.patient);
        setEvents(h.data.events.slice(0, 4));
        setAppointments(a.data.appointments);
        setReminders(r.data.reminders.filter((rem: Reminder) => !rem.isDone).slice(0, 4));
      });
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  const upcoming = appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).slice(0, 3);
  const bmiInfo = calculateBMI(patient?.weight, patient?.height);
  const healthStatus = evaluateHealthStatus(patient);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-vault-primary mb-1">Health Dashboard</p>
          <h1 className="text-2xl font-display font-semibold">Hi {patient?.name?.split(" ")[0] || "there"}, here's your health summary.</h1>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <UserCog className="w-4 h-4 text-vault-primary" /> Update Vitals & Profile
        </button>
      </div>

      {/* Dynamic Health Status & Vitals Overview Banner */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Card 1: Dynamic Health Status */}
        <Card className="lg:col-span-2 flex flex-col justify-between bg-gradient-to-br from-white to-vault-bg border-vault-line">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-vault-primary font-semibold flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4" /> Dynamic Health Status
              </span>
              <span className={`badge ${healthStatus.badgeBg} ${healthStatus.textColor} border ${healthStatus.borderColor} font-semibold text-xs`}>
                {healthStatus.status}
              </span>
            </div>
            <h3 className="text-lg font-display font-semibold text-vault-ink mb-1.5">{healthStatus.headline}</h3>
            <p className="text-sm text-vault-muted leading-relaxed mb-4">{healthStatus.summary}</p>
          </div>

          <div className="pt-3 border-t border-vault-line/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-vault-muted">
            {patient?.bloodGroup && (
              <span className="flex items-center gap-1.5">
                <strong className="text-vault-ink">Blood Group:</strong> {patient.bloodGroup}
              </span>
            )}
            {patient?.allergies && patient.allergies.toLowerCase() !== "none" && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <strong>Allergy:</strong> {patient.allergies}
              </span>
            )}
            {patient?.emergencyContactPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-vault-primary" />
                <strong className="text-vault-ink">Emergency:</strong> {patient.emergencyContactName} ({patient.emergencyContactPhone})
              </span>
            )}
          </div>
        </Card>

        {/* Card 2: Vitals & Body Mass Index */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-vault-primary font-semibold flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Body Metrics & BMI
              </span>
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-xs text-vault-primary font-medium hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-vault-bg/80 border border-vault-line">
                <p className="text-[11px] text-vault-muted">Height</p>
                <p className="text-base font-semibold text-vault-ink">
                  {patient?.height ? `${patient.height} cm` : "—"}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-vault-bg/80 border border-vault-line">
                <p className="text-[11px] text-vault-muted">Weight</p>
                <p className="text-base font-semibold text-vault-ink">
                  {patient?.weight ? `${patient.weight} kg` : "—"}
                </p>
              </div>
            </div>

            {bmiInfo ? (
              <div className={`p-3 rounded-xl border ${bmiInfo.badgeBg} ${bmiInfo.borderColor} space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-vault-ink">Calculated BMI</span>
                  <span className={`text-xs font-bold ${bmiInfo.textColor}`}>{bmiInfo.bmi}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${bmiInfo.textColor}`}>{bmiInfo.category}</span>
                  <span className="text-[10px] text-vault-muted">Ideal: 18.5 – 24.9</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-vault-line bg-vault-bg/50 text-center">
                <p className="text-xs text-vault-muted mb-2">Height and weight are required to calculate your BMI.</p>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="btn-ghost text-xs px-2 py-1"
                >
                  + Add height & weight
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickLink to="/patient/vault" icon={FolderLock} label="Health Vault" />
        <QuickLink to="/patient/appointments" icon={CalendarCheck} label="Appointments" />
        <QuickLink to="/patient/prescriptions" icon={Pill} label="Prescriptions" />
        <QuickLink to="/patient/reminders" icon={BellRing} label="Reminders" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeading eyebrow="What happened recently" title="Health Timeline" action={
            <Link to="/patient/history" className="btn-ghost text-sm flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          } />
          {events.length === 0 ? (
            <p className="text-sm text-vault-muted">No events recorded yet.</p>
          ) : (
            <div className="vault-thread space-y-5 pl-6">
              {events.map((e) => (
                <div key={e.id} className="vault-node">
                  <p className="text-xs font-mono text-vault-muted">{format(new Date(e.eventDate), "MMM d, yyyy")}</p>
                  <p className="text-sm font-medium">{e.title}</p>
                  {e.description && <p className="text-xs text-vault-muted mt-0.5">{e.description}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionHeading eyebrow="What's next" title="Upcoming appointments" action={
              <Link to="/patient/appointments" className="btn-ghost text-sm flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            } />
            {upcoming.length === 0 ? (
              <p className="text-sm text-vault-muted">No upcoming appointments. <Link to="/patient/find-doctors" className="text-vault-primary font-medium">Find a doctor</Link></p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{a.doctor?.name}</p>
                      <p className="text-xs text-vault-muted">{a.slot ? format(new Date(a.slot.startTime), "MMM d, h:mm a") : "—"}</p>
                    </div>
                    <span className="badge bg-vault-primaryLight text-vault-primary">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeading eyebrow="Don't forget" title="Reminders" action={
              <Link to="/patient/reminders" className="btn-ghost text-sm flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            } />
            {reminders.length === 0 ? (
              <p className="text-sm text-vault-muted">No pending reminders.</p>
            ) : (
              <div className="space-y-3">
                {reminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-vault-muted">{format(new Date(r.remindAt), "MMM d, h:mm a")}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showProfileModal && patient && (
        <PatientProfileModal
          patient={patient}
          onClose={() => setShowProfileModal(false)}
          onSaved={(updated) => {
            setPatient(updated);
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="card p-4 flex items-center gap-3 hover:border-vault-primary/40 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-vault-primaryLight flex items-center justify-center text-vault-primary group-hover:bg-vault-primary group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
