import { BookOpen, Video, Upload, Loader2, Calendar, Users, FileText, CheckCircle2, Clock } from "lucide-react";
import { useGetTeacherDashboardQuery } from "../Api/adminApi";

export default function TeacherDashboard() {
  const { data: dashboardData, isLoading, isError } = useGetTeacherDashboardQuery();

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100">
          <p className="text-red-500 font-medium mb-2">Failed to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-gray-600 hover:text-teal-600 underline"
          >
            Try refreshing the page
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Active Courses",
      value: dashboardData?.active_courses || 0,
      icon: BookOpen,
      color: "bg-blue-100",
      textColor: "text-blue-600"
    },
    {
      label: "Live Sessions Today",
      value: dashboardData?.live_sessions_today || 0,
      icon: Video,
      color: "bg-green-100",
      textColor: "text-green-600"
    },
    {
      label: "New Uploads",
      value: dashboardData?.recent_uploads?.length || 0,
      icon: Upload,
      color: "bg-purple-100",
      textColor: "text-purple-600"
    },
  ];

  return (
    <div className="min-h-screen bg-transparent p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 font-arimo">Teacher Dashboard</h1>
          <p className="text-gray-500">Overview of your courses and upcoming activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow"
              >
                <div className={`${stat.color} p-4 rounded-xl`}>
                  <Icon size={24} className={stat.textColor} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-0.5">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 font-arimo">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Live Sessions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-gray-800">Upcoming Live Sessions</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.upcoming_live_sessions?.length > 0 ? (
                  dashboardData.upcoming_live_sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-teal-200 hover:bg-teal-50/30 transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-1 group-hover:text-teal-700 transition-colors">
                          {session.title}
                        </p>
                        <div className="flex flex-wrap gap-y-1 gap-x-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTime(session.scheduled_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            <span>{session.enrolled_count} Students</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xm font-medium text-gray-400">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{session.course_title}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className="bg-teal-100 text-teal-700 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg shrink-0">
                          Scheduled
                        </span>
                        {session.zoom_start_url && (
                          <a 
                            href={session.zoom_start_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-600 font-semibold hover:underline"
                          >
                            Join as Host
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No live sessions scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-800">Recent Content</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.recent_uploads?.length > 0 ? (
                  dashboardData.recent_uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                          {upload.content_type === 'quiz' ? <BookOpen size={18} /> : 
                           upload.content_type === 'assignment' ? <FileText size={18} /> : 
                           <CheckCircle2 size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{upload.title}</p>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-tight mt-0.5">
                            {upload.course_title} • <span className="text-gray-400 capitalize">{upload.content_type.replace('_', ' ')}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No recent uploads found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
