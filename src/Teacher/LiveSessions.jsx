'use client';

import { useState } from 'react';
import { Video, Calendar, Clock, Users, ExternalLink, Play, Radio, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useGetTeacherLiveSessionsQuery } from '../Api/adminApi';

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatLocal(utcStr, opts) {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: TZ }).format(new Date(utcStr));
}

function isWithin30Min(scheduledAt) {
  const diff = new Date(scheduledAt) - Date.now();
  return diff <= 30 * 60 * 1000 && diff >= -60 * 60 * 1000;
}

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', bg: 'bg-gray-100', text: 'text-gray-600', icon: Calendar },
  upcoming: { label: 'Starting Soon', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  live:     { label: 'Live Now', bg: 'bg-red-100',  text: 'text-red-700',  icon: Radio },
  completed:{ label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-600', icon: CheckCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SessionCard({ session }) {
  const isLive = session.live_status === 'live';
  const canStart = isLive || (session.scheduled_at && isWithin30Min(session.scheduled_at));

  const dateStr = session.scheduled_at
    ? formatLocal(session.scheduled_at, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const timeStr = session.scheduled_at
    ? formatLocal(session.scheduled_at, { hour: '2-digit', minute: '2-digit' })
    : null;

  const endTimeStr = session.scheduled_at && session.duration_in_minutes
    ? formatLocal(
        new Date(new Date(session.scheduled_at).getTime() + session.duration_in_minutes * 60000).toISOString(),
        { hour: '2-digit', minute: '2-digit' }
      )
    : null;

  return (
    <div className={`bg-white rounded-lg p-6 flex items-start justify-between hover:shadow-md transition-shadow border-l-4 ${
      isLive ? 'border-red-500' : session.live_status === 'completed' ? 'border-gray-300' : 'border-teal-500'
    }`}>
      {/* Left */}
      <div className="flex gap-4 flex-1 min-w-0">
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
          isLive ? 'bg-red-50' : 'bg-teal-50'
        }`}>
          <Video className={`w-6 h-6 ${isLive ? 'text-red-500' : 'text-teal-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{session.title}</h3>
          <p className="text-xs text-gray-500 mb-3 truncate">
            {session.course_title} · {session.module_title}
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-gray-600 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{dateStr}</span>
            </div>
            {timeStr && (
              <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{timeStr}{endTimeStr ? ` – ${endTimeStr}` : ''}</span>
                {session.duration_in_minutes && (
                  <span className="text-gray-400">({session.duration_in_minutes} min)</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-600 text-sm">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>{session.enrolled_count} enrolled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-3 ml-6 flex-shrink-0">
        <StatusBadge status={session.live_status} />

        {session.zoom_start_url && session.live_status !== 'completed' && (
          <a
            href={canStart ? session.zoom_start_url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={!canStart ? (e) => e.preventDefault() : undefined}
            title={canStart ? 'Start Zoom session' : 'Available 30 min before start'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : canStart
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLive ? <Radio className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isLive ? 'Join Live' : 'Start Session'}
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        )}

        {session.zoom_join_url && session.live_status === 'completed' && (
          <a
            href={session.zoom_join_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> View Recording
          </a>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live',     label: 'Live Now' },
  { key: 'completed', label: 'Completed' },
];

export default function LiveSessions() {
  const [activeStatus, setActiveStatus] = useState('upcoming');

  const { data, isLoading, isError } = useGetTeacherLiveSessionsQuery({ status: activeStatus });
  const sessions = data?.results ?? data ?? [];

  // live count badge
  const { data: liveData } = useGetTeacherLiveSessionsQuery({ status: 'live' });
  const liveCount = (liveData?.results ?? liveData ?? []).length;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-teal-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
          {liveCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
              {liveCount} Live
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-6">
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1 w-fit mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveStatus(key)}
              className={`relative px-5 py-2 rounded text-sm font-medium transition-all ${
                activeStatus === key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
              {key === 'live' && liveCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {liveCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading sessions…</span>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Failed to load sessions. Make sure you're logged in.</span>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && sessions.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No {activeStatus} sessions</p>
            {activeStatus === 'upcoming' && (
              <p className="text-sm mt-1">Sessions scheduled in the future will appear here.</p>
            )}
          </div>
        )}

        {/* Sessions */}
        {!isLoading && !isError && sessions.length > 0 && (
          <div className="space-y-4 pb-8">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
