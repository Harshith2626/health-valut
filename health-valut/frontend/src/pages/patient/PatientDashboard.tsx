import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderLock, CalendarCheck, Pill, BellRing, ArrowRight, AlertTriangle } from "lucide-react";
import { api } from "../../api/client";
import { Card, SectionHeading, Spinner } from "../../components/UI";
import { MedicalHistoryEvent, Appointment, Reminder, Patient } from "../../types";
import { format } from "date-fns";

export default function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [events, setEvents] = useState<MedicalHistoryEvent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    Promise.all([
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
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  const upcoming = appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).slice(0, 3);
  const profileGaps = !patient?.bloodGroup || !patient?.emergencyContactPhone;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-vault-primary mb-1">Dashboard</p>
        <h1 className="text-2xl font-display font-semibold">Hi {patient?.name?.split(" ")[0]}, here's where things stand.</h1>
      </div>

      {profileGaps && (
        <Card className="border-vault-gold/40 bg-vault-gold/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-vault-gold shrink-0" />
          <p className="text-sm">
            Your health profile is missing key emergency details. <Link to="/patient/vault" className="font-medium underline">Complete it</Link> so doctors can help faster in an emergency.
          </p>
        </Card>
      )}

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
