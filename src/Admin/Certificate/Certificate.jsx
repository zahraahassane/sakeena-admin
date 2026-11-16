import React, { useState } from "react";
import {
  BookOpen,
  Award,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import CertificateDetails from "./CertificateDetails";
import { useGetCoursesDataQuery } from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import { getCourseTeacherNames } from "../../utils/courseTeachers";

const StepItem = ({ number, title, subtitle }) => (
  <div className="w-full flex items-start gap-4">
    <div className="w-6 h-6 bg-greenTeal rounded-full flex justify-center items-center shrink-0">
      <span className="text-white text-sm font-bold arimo-font">{number}</span>
    </div>
    <div className="flex flex-row items-baseline gap-1 flex-wrap">
      <span className="text-neutral-700 text-base font-bold arimo-font">
        {title}
      </span>
      <span className="text-neutral-700 text-base font-normal arimo-font">
        {subtitle}
      </span>
    </div>
  </div>
);

const CourseCard = ({ course, onClick }) => {
  const teacherName = getCourseTeacherNames(course) || "Unknown Instructor";

  return (
    <div
      onClick={() => onClick({ ...course, instructor: teacherName })}
      className="w-full p-5 rounded-2xl bg-white border border-neutral-200 hover:shadow-md transition-all flex justify-between items-center group cursor-pointer hover:border-slate-300"
    >
      <div className="flex-1 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-b from-greenTeal to-stone-300 rounded-[10px] flex justify-center items-center text-white shrink-0 shadow-sm">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt="" className="w-full h-full object-cover rounded-[10px]" />
          ) : (
             <BookOpen size={28} strokeWidth={1.5} />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-neutral-800 text-lg font-bold arimo-font group-hover:text-greenTeal transition-colors">
            {course.title}
          </h3>
          <p className="text-neutral-500 text-sm font-normal arimo-font">
            Instructor: {teacherName}
          </p>
        </div>
      </div>
      <div className="pr-2 text-neutral-300 group-hover:text-greenTeal transition-colors">
        <ChevronRight size={24} />
      </div>
    </div>
  );
};

const Certificate = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: coursesData, isLoading } = useGetCoursesDataQuery(currentPage);
  const courses = coursesData?.results || [];

  if (selectedCourse) {
    return (
      <CertificateDetails
        selectedCourse={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 space-y-8 animate-in fade-in duration-500">
      <div className="w-full bg-gradient-to-br from-[#D6CBAF4D] to-[#7AA4A533] rounded-2xl p-8 flex justify-between items-center relative overflow-hidden">
        <div className="flex-1 z-10">
          <h2 className="text-neutral-800 text-3xl font-bold arimo-font mb-6">
            Generate Certificates in 4 Steps
          </h2>
          <div className="space-y-3 max-w-lg">
            <StepItem
              number="1"
              title="Select a course"
              subtitle="from the list below"
            />
            <StepItem
              number="2"
              title="Choose Template"
              subtitle="for certificates"
            />
            <StepItem
              number="3"
              title="Choose students"
              subtitle="who completed the course"
            />
            <StepItem
              number="4"
              title="Generate certificates"
              subtitle="for all selected students at once via email"
            />
          </div>
        </div>

        <div className="hidden lg:block w-[400px] h-full object-cover">
          <div className="w-full h-48 bg-white/50 rounded-xl border border-white/60 shadow-lg p-4 flex items-center justify-center relative transform rotate-[-2deg] hover:rotate-0 transition-all duration-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center text-blue-600">
                <Award size={32} />
              </div>
              <div className="font-bold text-neutral-800 text-lg arimo-font">
                Certificate of Completion
              </div>
              <div className="text-neutral-500 text-sm arimo-font mt-1">
                Given to{" "}
                <span className="font-bold text-blue-600">John Doe</span>
              </div>
            </div>
            <div className="absolute top-2 left-2 text-yellow-400">
              <CheckCircle size={16} />
            </div>
            <div className="absolute bottom-4 right-6 text-purple-400">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-neutral-800 text-xl font-bold arimo-font flex items-center gap-4">
          Select a Course
          {isLoading && <div className="w-4 h-4 rounded-full border-b-2 border-greenTeal animate-spin"></div>}
        </h2>
        
        {courses.length === 0 && !isLoading ? (
           <div className="p-8 text-center text-neutral-500 bg-white rounded-xl border border-neutral-200">
             No active courses found.
           </div>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={setSelectedCourse}
              />
            ))}
          </div>
        )}

        {coursesData?.total_pages > 1 && (
          <div className="mt-6">
            <Pagination 
               currentPage={currentPage}
               totalPages={coursesData.total_pages}
               onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;
