import { Users, BookOpen, DollarSign } from "lucide-react";
import TopPerformingCourses from "./TopPerformingCourses";
import ScheduleRescheduleSection from "./ScheduleRescheduleSection";
import { useGetAdminDashboardQuery } from "../../Api/adminApi";

const MainDashboard = () => {
  const { data: dashboardData, isLoading } = useGetAdminDashboardQuery();

  const stats = dashboardData?.stats || {
    total_students: 0,
    total_teachers: 0,
    active_courses: 0,
    monthly_revenue: 0,
    monthly_revenue_period: "",
  };

  const topCourses = dashboardData?.top_courses || [];
  const todaysClasses = dashboardData?.todays_classes || [];

  const cards = [
    {
      title: "Total Students",
      number: stats.total_students.toString(),
      icon: Users,
      iconColor: "#ffffff",
      bgColor: "#2B7FFF",
    },
    {
      title: "Total Teachers",
      number: stats.total_teachers.toString(),
      icon: Users,
      iconColor: "#ffffff",
      bgColor: "#AD46FF",
    },
    {
      title: "Active Courses",
      number: stats.active_courses.toString(),
      icon: BookOpen,
      iconColor: "#ffffff",
      bgColor: "#7AA4A5",
    },
    {
      title: stats.monthly_revenue_period
        ? `Monthly Revenue (${stats.monthly_revenue_period})`
        : "Monthly Revenue",
      number: `$${Number(stats.monthly_revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      iconColor: "#ffffff",
      bgColor: "#1B08C0",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pt-5">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-[#FAFDFF] border border-[#E1F1FB] p-4 flex items-center justify-between rounded-xl shadow-lg"
            >
              <div className="text-[#2B2B2B] flex flex-col gap-2">
                <h2 className="font-semibold text-sm">{card.title}</h2>
                <p className="font-bold text-xl">{card.number}</p>
              </div>
              <div
                className="w-12 h-12 p-3 rounded-lg"
                style={{
                  backgroundColor: card.bgColor,
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{
                    color: card.iconColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Performing Courses */}
      <TopPerformingCourses courses={topCourses} />

      {/* Schedule and Reschedule */}
      <ScheduleRescheduleSection classes={todaysClasses} />
    </div>
  );
};

export default MainDashboard;
