import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, isToday } from "date-fns";
import { CalendarCheck, Users, ArrowRight } from "lucide-react";
import { api } from "../../api/client";
import { Card, SectionHeading, Spinner, StatusBadge } from "../../components/UI";
import { Appointment, Doctor } from "../../types";

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/doctors/me"), api.get("/appointments/me")])
      .then(([d, a]) => {
        setDoctor(d.data.doctor);
        setAppointments(a.data.appointments);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  const today = appointments.filter((a) => a.slot && isToday(new Date(a.slot.startTime)) && a.status === "CONFIRMED");
  const upcoming = appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).slice(0, 6);
  const uniquePatients = Array.from(new Map(appointments.map((a) => [a.patientId, a.patient])).entries());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-vault-primary mb-1">Doctor Dashboard</p>
        <h1 className="text-2xl font-display font-semibold">Welcome back, Dr. {doctor?.name.split(" ").pop()}</h1>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-vault-primaryLight flex items-center justify-center text-vault-primary"><CalendarCheck className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-display font-semibold">{today.length}</p>
            <p className="text-xs text-vault-muted">Appointments today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-vault-primaryLight flex items-center justify-center text-vault-primary"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-display font-semibold">{uniquePatients.length}</p>
            <p className="text-xs text-vault-muted">Patients seen</p>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeading title="Upcoming appointments" action={
          <Link to="/doctor/appointments" className="btn-ghost text-sm flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
        } />
        {upcoming.length === 0 ? (
          <p className="text-sm text-vault-muted">No upcoming appointments.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <Link to={`/doctor/patient/${a.patientId}`} className="font-medium hover:text-vault-primary transition-colors">{a.patient?.name}</Link>
                  <p className="text-xs text-vault-muted">{a.slot ? format(new Date(a.slot.startTime), "MMM d, h:mm a") : "—"}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeading title="Recent patients" />
        {uniquePatients.length === 0 ? (
          <p className="text-sm text-vault-muted">Patients will appear here once you have appointments.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {uniquePatients.map(([id, p]) => (
              <Link key={id} to={`/doctor/patient/${id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-vault-primaryLight transition-colors">
                <div className="w-8 h-8 rounded-full bg-vault-primaryLight flex items-center justify-center text-vault-primary text-xs font-semibold">{p?.name?.[0]}</div>
                <span className="text-sm font-medium">{p?.name}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
