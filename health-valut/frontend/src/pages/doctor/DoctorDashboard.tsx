import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, isToday } from "date-fns";
import { CalendarCheck, Users, ArrowRight, UserCog, Stethoscope, MapPin, Phone, IndianRupee } from "lucide-react";
import { api } from "../../api/client";
import { Card, SectionHeading, Spinner, StatusBadge } from "../../components/UI";
import { Appointment, Doctor } from "../../types";
import DoctorProfileModal from "../../components/DoctorProfileModal";

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  function loadData() {
    return Promise.all([api.get("/doctors/me"), api.get("/appointments/me")])
      .then(([d, a]) => {
        setDoctor(d.data.doctor);
        setAppointments(a.data.appointments);
      });
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  const today = appointments.filter((a) => a.slot && isToday(new Date(a.slot.startTime)) && a.status === "CONFIRMED");
  const upcoming = appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).slice(0, 6);
  const uniquePatients = Array.from(new Map(appointments.map((a) => [a.patientId, a.patient])).entries());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-vault-primary mb-1">Doctor Portal</p>
          <h1 className="text-2xl font-display font-semibold">Welcome back, Dr. {doctor?.name.split(" ").pop()}</h1>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <UserCog className="w-4 h-4 text-vault-primary" /> Edit Practice Profile
        </button>
      </div>

      {/* Doctor Summary Banner */}
      <Card className="bg-gradient-to-br from-white to-vault-bg border-vault-line">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-vault-primaryLight text-vault-primary font-medium">
                {doctor?.specialization}
              </span>
              {doctor?.qualification && (
                <span className="text-xs text-vault-muted font-mono">
                  {doctor.qualification} {doctor.experienceYears ? `· ${doctor.experienceYears} yrs exp` : ""}
                </span>
              )}
            </div>
            <h2 className="text-xl font-display font-semibold text-vault-ink">{doctor?.name}</h2>
            {doctor?.biography && (
              <p className="text-xs text-vault-muted mt-1.5 max-w-2xl leading-relaxed">{doctor.biography}</p>
            )}
          </div>
          <div className="text-left sm:text-right text-xs text-vault-muted space-y-1">
            {doctor?.clinicName && (
              <p className="flex items-center sm:justify-end gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-vault-primary" />
                {[doctor.clinicName, doctor.location].filter(Boolean).join(", ")}
              </p>
            )}
            {doctor?.phone && (
              <p className="flex items-center sm:justify-end gap-1.5">
                <Phone className="w-3.5 h-3.5 text-vault-primary" />
                {doctor.phone}
              </p>
            )}
            {doctor?.consultationFee != null && (
              <p className="font-semibold text-vault-ink">
                Consultation Fee: ₹{doctor.consultationFee}
              </p>
            )}
          </div>
        </div>
      </Card>

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

      {showProfileModal && doctor && (
        <DoctorProfileModal
          doctor={doctor}
          onClose={() => setShowProfileModal(false)}
          onSaved={(updated) => {
            setDoctor(updated);
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}
