import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  X,
  Users,
  LayoutGrid,
} from "lucide-react";

const CourseDetailsContent = ({ course }) => {
  if (!course) return null;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const getDisplayValue = (value) => {
    if (value == null) return "N/A";
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
    return String(value);
  };

  const instructorName = course.teacher?.user 
    ? `${course.teacher.user.first_name} ${course.teacher.user.last_name}`
    : "N/A";

  const categoryName = course.category?.name || "N/A";
  const durationText = course.duration_in_weeks ? `${course.duration_in_weeks} Weeks` : "N/A";
  const lessonsText = course.total_lessons ? `${course.total_lessons} Lessons` : "N/A";

  const filteredStudents = useMemo(() => {
    if (!course.enrollments) return [];
    return course.enrollments.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.courseDetails
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.orderId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || student.paymentStatus === statusFilter;

      const matchesDate =
        !dateFilter || student.enrollmentDate.includes(dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [searchTerm, statusFilter, dateFilter, course.enrollments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Details Grid */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
        <div className="flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-xs">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          Course Information
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="col-span-2 md:col-span-3">
            <DetailItem label="Course Title" value={course.title} />
          </div>
          <div className="col-span-2 md:col-span-3">
            <DetailItem
              label="Course Subtitle"
              value={course.subtitle || "N/A"}
            />
          </div>
          <DetailItem 
            label="Status" 
            value={
              course.status ? (
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    course.status === "running" ? "bg-red-500 animate-pulse" : 
                    course.status === "upcoming" ? "bg-lime-500" : "bg-sky-500"
                  }`} />
                  <span className="uppercase text-xs font-black tracking-tight">{course.status}</span>
                </div>
              ) : "N/A"
            } 
          />
          <DetailItem label="Level" value={course.level || "Beginner"} />
          <DetailItem label="Price" value={`$${course.price || "0.00"}`} />
          
          <DetailItem label="Instructor" value={instructorName} />
          <DetailItem label="Category" value={categoryName} />
          <DetailItem label="Duration" value={durationText} />
          
          <DetailItem label="Lessons" value={lessonsText} />
          <DetailItem label="Hours Per Session" value={`${course.hours_per_session || "0"} hrs`} />
          <DetailItem label="Total Hours" value={`${course.total_hours || "0"} hrs`} />

          <div className="col-span-2 md:col-span-3">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3 block">
              Description
            </label>
            {(() => {
              const cleanDescription = (course.description || "")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&");
              return (
                <div
                  className="p-5 bg-stone-50 rounded-2xl border border-stone-100 text-[15px] text-stone-600 leading-relaxed font-medium rich-text-content"
                  dangerouslySetInnerHTML={{ __html: cleanDescription || "No description provided." }}
                />
              );
            })()}
          </div>
        </div>
      </div>

      {/* Teacher Profile Section */}
      {course.teacher && (
        <section className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-xs">
            <Users className="w-4 h-4 text-teal-600" />
            About the Instructor
          </div>
          <div className="flex flex-col md:flex-row items-start gap-6 p-6 bg-stone-50 rounded-3xl border border-stone-100">
            <img 
              src={course.teacher.profile_picture || "https://zahra-cdn.b-cdn.net/teachers/profiles/placeholder.webp"} 
              alt={instructorName}
              className="w-24 h-24 rounded-2xl object-cover shadow-sm border-4 border-white"
            />
            <div className="space-y-3 flex-1">
              <div>
                <h4 className="text-xl font-black text-stone-900 tracking-tight">{instructorName}</h4>
                <p className="text-sm font-bold text-teal-600 uppercase tracking-wider">{course.teacher.professional_title || "Instructor"}</p>
              </div>
              <p className="text-[15px] text-stone-600 leading-relaxed font-medium">
                {course.teacher.about || "No biography provided."}
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Rate:</span>
                  <span className="text-xs font-bold text-stone-700">${course.teacher.consultation_rate}/hr</span>
                </div>
                {course.teacher.offers_consultations && (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                    Available for Consultations
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enrollment Status section */}
      {course.enrollments && course.enrollments.length > 0 && (
        <section className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                Enrollment Status
              </p>
              <h3 className="text-3xl font-black text-stone-900">
                {filteredStudents.length}{" "}
                <span className="text-lg font-medium text-stone-400 ml-1">
                  {filteredStudents.length === 1 ? "Student" : "Students"} found
                </span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search students, courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all w-64"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-11 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Course Details</th>
                  <th className="px-6 py-4">Enrollment Date & Time</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Order ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-800">{student.name}</td>
                    <td className="px-6 py-4 text-stone-500 font-medium">{student.courseDetails}</td>
                    <td className="px-6 py-4 text-stone-500 font-medium whitespace-nowrap">{student.enrollmentDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        student.paymentStatus === "Completed" ? "bg-teal-50 text-teal-600" : 
                        student.paymentStatus === "Pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      }`}>
                        {student.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-teal-600 font-bold text-xs hover:underline transition-all">
                        {student.orderId}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Related Courses Section */}
      {course.related_courses && course.related_courses.length > 0 && (
        <section className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
          <div className="flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-xs">
            <LayoutGrid className="w-4 h-4 text-teal-600" />
            Related Courses
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {course.related_courses.map((rel) => (
              <div key={rel.id} className="group bg-stone-50 rounded-3xl border border-stone-100 overflow-hidden hover:shadow-md transition-all">
                <div className="aspect-[16/9] relative">
                  <img 
                    src={rel.thumbnail || "https://zahra-cdn.b-cdn.net/courses/thumbnails/placeholder.webp"} 
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-[10px] font-bold text-stone-600 uppercase tracking-tighter">
                    {rel.level}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h5 className="font-bold text-stone-800 line-clamp-1 group-hover:text-teal-700 transition-colors">{rel.title}</h5>
                  <div className="flex items-center justify-between">
                    <span className="text-teal-800 font-bold text-sm">${rel.price}</span>
                    <span className="text-xs text-stone-400 font-medium">{rel.duration_in_weeks} Weeks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="space-y-2">
    <div className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
      {label}
    </div>
    <div className="px-5 py-3.5 bg-stone-50 rounded-2xl border border-stone-100 font-bold text-stone-800">
      {value}
    </div>
  </div>
);

export default CourseDetailsContent;
