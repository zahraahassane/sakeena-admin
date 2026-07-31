'use client';

import { useState } from 'react';
import { Calendar, Clock, Video, ChevronLeft, ChevronRight, X, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import {
  useGetConsultationsQuery,
  useGetConsultationCalendarQuery,
  useGetConsultationTimeslotsQuery,
  useGetTeacherUpcomingSessionsQuery,
  useGetTeacherProfileMeQuery,
  useGetConsultationEarningsQuery,
} from '../Api/adminApi';

function formatLocal(utcStr, opts = {}) {
  return new Intl.DateTimeFormat('en-US', {
    ...opts,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(utcStr));
}

function durationMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

function isWithin30Min(scheduledStart) {
  const diff = new Date(scheduledStart) - Date.now();
  return diff <= 30 * 60 * 1000 && diff >= -60 * 60 * 1000;
}

// ── Day Slots Slide-Over ───────────────────────────────────────────────────────
function DaySlotsPanel({ consultationId, date, onClose }) {
  const { data: slotsRaw, isLoading, isError } = useGetConsultationTimeslotsQuery(
    { id: consultationId, date },
    { skip: !consultationId || !date }
  );

  // API returns paginated { count, results: [...] } — normalise to array
  const slots = Array.isArray(slotsRaw) ? slotsRaw : (slotsRaw?.results ?? []);

  const displayDate = formatLocal(date + 'T00:00:00', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="bg-teal-600 text-white p-5 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-lg font-bold">{displayDate}</h2>
            <p className="text-teal-100 text-sm mt-0.5">Time Slots</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-teal-700 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading slots…</span>
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Failed to load timeslots.</span>
            </div>
          )}
          {!isLoading && !isError && slots.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No slots on this day.</p>
            </div>
          )}
          {!isLoading && !isError && slots.length > 0 && (
            <div className="space-y-3">
              {slots.map((slot) => {
                const startTime = formatLocal(slot.scheduled_start, { hour: '2-digit', minute: '2-digit' });
                const endTime = formatLocal(slot.scheduled_end, { hour: '2-digit', minute: '2-digit' });
                const duration = durationMinutes(slot.scheduled_start, slot.scheduled_end);
                return (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      slot.is_booked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{startTime} – {endTime}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{duration} min</p>
                    </div>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      slot.is_booked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {slot.is_booked ? '🔒 Booked' : '✅ Free'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Availability Calendar ──────────────────────────────────────────────────────
function AvailabilityCalendar({ consultationId }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data: calendarData, isLoading, isError } = useGetConsultationCalendarQuery(
    { id: consultationId, month: monthKey, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { skip: !consultationId }
  );

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Build Mon-first grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const getDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDotColor = (day) => {
    if (!day || !calendarData) return null;
    const entry = calendarData[getDateKey(day)];
    if (!entry) return null;
    return entry.status === 'available' ? 'green' : 'red';
  };

  return (
    <div>
      {/* Month Nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-bold text-gray-900">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading calendar…</span>
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Failed to load calendar data.</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateKey = getDateKey(day);
              const dotColor = getDotColor(day);
              const isToday = dateKey === todayKey;
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={i}
                  onClick={() => dotColor && setSelectedDate(dateKey)}
                  disabled={!dotColor}
                  className={`relative flex flex-col items-center justify-center h-12 rounded-lg text-sm font-medium transition-all
                    ${dotColor ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}
                    ${isSelected ? 'bg-teal-100 ring-2 ring-teal-400' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-teal-300' : ''}
                    ${isToday ? 'text-teal-700 font-bold' : dotColor ? 'text-gray-900' : 'text-gray-300'}
                  `}
                >
                  {day}
                  {dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      dotColor === 'green' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-100 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              Available
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Fully Booked
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Click a highlighted day to view individual time slots
          </p>
        </>
      )}

      {selectedDate && (
        <DaySlotsPanel
          consultationId={consultationId}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

// ── Sessions Day Panel ────────────────────────────────────────────────────────
function SessionsDayPanel({ sessions, date, onClose }) {
  const displayDate = formatLocal(date + 'T00:00:00', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="bg-teal-600 text-white p-5 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-lg font-bold">{displayDate}</h2>
            <p className="text-teal-100 text-sm mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-teal-700 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sessions.map((slot) => {
            const startTime = formatLocal(slot.scheduled_start, { hour: '2-digit', minute: '2-digit' });
            const endTime = formatLocal(slot.scheduled_end, { hour: '2-digit', minute: '2-digit' });
            const duration = durationMinutes(slot.scheduled_start, slot.scheduled_end);
            const canStart = isWithin30Min(slot.scheduled_start);

            return (
              <div key={slot.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{startTime} – {endTime}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{duration} min session</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    Booked
                  </span>
                </div>

                {slot.zoom_start_url && (
                  <a
                    href={canStart ? slot.zoom_start_url : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={!canStart ? (e) => e.preventDefault() : undefined}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      canStart
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={canStart ? 'Start Zoom session' : 'Available 30 min before session'}
                  >
                    <Video className="w-4 h-4" />
                    {canStart ? 'Start Zoom ↗' : 'Start Zoom (not yet)'}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sessions Calendar ─────────────────────────────────────────────────────────
function SessionsCalendar({ sessions, isLoading, isError }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Group sessions by local date key YYYY-MM-DD
  const sessionsByDate = {};
  sessions.forEach((slot) => {
    const d = new Date(slot.scheduled_start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!sessionsByDate[key]) sessionsByDate[key] = [];
    sessionsByDate[key].push(slot);
  });

  const getDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] ?? []) : [];

  return (
    <div>
      {/* Month Nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-bold text-gray-900">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading sessions…</span>
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Failed to load sessions. Make sure you're logged in.</span>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateKey = getDateKey(day);
              const daySessions = sessionsByDate[dateKey];
              const hasSession = !!daySessions;
              const isToday = dateKey === todayKey;
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={i}
                  onClick={() => hasSession && setSelectedDate(dateKey)}
                  disabled={!hasSession}
                  className={`relative flex flex-col items-center justify-center h-12 rounded-lg text-sm font-medium transition-all
                    ${hasSession ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}
                    ${isSelected ? 'bg-teal-100 ring-2 ring-teal-400' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-teal-300' : ''}
                    ${isToday ? 'text-teal-700 font-bold' : hasSession ? 'text-gray-900' : 'text-gray-300'}
                  `}
                >
                  {day}
                  {hasSession && (
                    <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-100 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Has Session
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Click a highlighted day to view sessions
          </p>
        </>
      )}

      {selectedDate && selectedSessions.length > 0 && (
        <SessionsDayPanel
          sessions={selectedSessions}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}


export default function Consultations() {
  const [activeTab, setActiveTab] = useState('booked');

  const { data: consultations } = useGetConsultationsQuery();
  const consultation = consultations?.results?.[0] ?? consultations?.[0] ?? null;

  const { data: teacherProfileMe } = useGetTeacherProfileMeQuery();
  const { data: earningsData, isLoading: earningsLoading } = useGetConsultationEarningsQuery();

  const {
    data: upcomingSessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useGetTeacherUpcomingSessionsQuery();
  const sessions = upcomingSessions?.results ?? upcomingSessions ?? [];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Upcoming Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {sessionsLoading ? '—' : sessions.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Standard Price</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {teacherProfileMe?.consultation_rate ? `$${parseFloat(teacherProfileMe.consultation_rate).toFixed(0)}` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-2">Set by admin</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Consultation</p>
              <p className="text-lg font-bold text-gray-900 mt-2 truncate max-w-[140px]" title={teacherProfileMe?.consultations?.[0]?.title ?? consultation?.title}>
                {teacherProfileMe?.consultations?.[0]?.title ?? consultation?.title ?? '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Read-only</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Consultation Earnings</p>
              <p className="text-3xl font-bold text-teal-600 mt-2">
                {earningsLoading ? '—' : `$${earningsData?.earnings ?? 0}`}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {earningsData?.sessions ?? 0} sessions this month
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('booked')}
            className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
              activeTab === 'booked'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming Sessions
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
              activeTab === 'availability'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Availability Calendar
          </button>
        </div>

        <div className="p-6">
          {/* Upcoming Sessions */}
          {activeTab === 'booked' && (
            <SessionsCalendar
              sessions={sessions}
              isLoading={sessionsLoading}
              isError={sessionsError}
            />
          )}

          {/* Availability Calendar */}
          {activeTab === 'availability' && (
            !(teacherProfileMe?.consultations?.[0] ?? consultation) ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No consultation profile found</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">
                  Your availability is managed by the admin. Contact them to update your schedule.
                </p>
              </div>
            ) : (
              <AvailabilityCalendar consultationId={(teacherProfileMe?.consultations?.[0] ?? consultation).id} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
