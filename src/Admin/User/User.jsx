import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import Pagination from "../../components/Pagination";
import StudentTable from "./StudentTable";
import TeacherTable from "./TeacherTable";
import TeacherDetails from "./TeacherDetails";
import AddUserModal from "./AddUserModal";
import toast from "react-hot-toast";
import {
  useGetTeacherProfilesQuery,
  useGetStudentProfilesQuery,
  useDeleteStudentProfileMutation,
  useDeleteTeacherProfileMutation,
} from "../../Api/adminApi";

const User = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentPage, setStudentPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);

  const [deleteStudentProfile] = useDeleteStudentProfileMutation();
  const [deleteTeacherProfile] = useDeleteTeacherProfileMutation();

  const { data: studentProfiles, isLoading: isStudentsLoading } =
    useGetStudentProfilesQuery({ page: studentPage, search: searchQuery });
  const { data: teacherProfiles, isLoading: isTeachersLoading } =
    useGetTeacherProfilesQuery({ page: teacherPage, search: searchQuery });

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  useEffect(() => {
    if (studentProfiles?.results) {
      setStudents(
        studentProfiles.results.map((student) => ({
          id: student.id,
          name:
            `${student.user.first_name || ""} ${student.user.last_name || ""}`.trim() ||
            student.user.email.split("@")[0],
          email: student.user.email,
          courses: 0,
          joined: student.user.joined_at
            ? new Date(student.user.joined_at).toLocaleDateString()
            : "N/A",
        })),
      );
    }
  }, [studentProfiles]);

  useEffect(() => {
    if (teacherProfiles?.results) {
      setTeachers(
        teacherProfiles.results.map((teacher) => ({
          id: teacher.id,
          name:
            `${teacher.user.first_name || ""} ${teacher.user.last_name || ""}`.trim() ||
            teacher.user.email.split("@")[0],
          email: teacher.user.email,
          department: teacher.professional_title || "N/A",
          courses: teacher.courses
            ? teacher.courses || teacher.courses.length
            : 0,
          students: 0,
          raw: teacher,
        })),
      );
    }
  }, [teacherProfiles]);

  const currentData = activeTab === "students" ? students : teachers;

  console.log(currentData);
  const filteredData = currentData.filter(
    (user) =>
      (user.name &&
        user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleTeacherView = (teacher) => {
    setSelectedTeacher(teacher);
  };

  const handleBackToList = () => {
    setSelectedTeacher(null);
  };

  const handleAddUser = (userData) => {
    if (activeTab === "students") {
      setStudents((prev) => [userData, ...prev]);
      toast.success(`Student ${userData.name} added successfully!`);
    } else {
      setTeachers((prev) => [userData, ...prev]);
      toast.success(`Teacher ${userData.name} added successfully!`);
    }
  };

  const confirmDelete = (userId, name) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="arimo-font text-sm text-neutral-800">
            Are you sure you want to delete <b>{name}</b>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-xs text-neutral-500 hover:text-neutral-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleDelete(userId);
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700 font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
        className:
          "border border-black/10 rounded-xl shadow-lg bg-white p-4 min-w-[300px]",
      },
    );
  };

  const handleDelete = async (userId) => {
    try {
      if (activeTab === "students") {
        await deleteStudentProfile(userId).unwrap();
        setStudents((prev) => prev.filter((s) => s.id !== userId));
        toast.success("Student removed successfully", { duration: 3000 });
      } else {
        await deleteTeacherProfile(userId).unwrap();
        setTeachers((prev) => prev.filter((t) => t.id !== userId));
        toast.success("Teacher removed successfully", { duration: 3000 });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete user. Please try again.");
    }
  };

  // Render the details view if a teacher is selected
  if (selectedTeacher) {
    return (
      <TeacherDetails teacher={selectedTeacher} onBack={handleBackToList} />
    );
  }

  return (
    <div className="pt-2 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-end w-full">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#89A6A7] hover:bg-[#729394] text-white px-6 py-2 rounded-lg text-sm font-medium arimo-font transition-colors shadow-sm"
        >
          Add {activeTab === "students" ? "Student" : "Teacher"}
        </button>
      </div>

      <div className="w-full bg-white rounded-2xl border border-black/10 shadow-sm p-6 flex flex-col gap-7 min-h-[610px]">
        {/* Card Header */}
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <h2 className="text-neutral-950 text-base font-normal arimo-font leading-4">
              All Users
            </h2>
            <p className="text-gray-500 text-base font-normal arimo-font leading-6">
              View and manage all platform users
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-[256px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full h-9 pl-10 pr-3 py-1 bg-zinc-100 rounded-lg border-transparent focus:outline-none text-sm arimo-font text-gray-700 placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setStudentPage(1);
                  setTeacherPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="w-full h-9 bg-gray-200/50 rounded-2xl p-[3px] flex gap-1 items-center">
          <button
            onClick={() => setActiveTab("students")}
            className={`flex-1 h-7 rounded-2xl flex items-center justify-center text-sm arimo-font transition-all ${
              activeTab === "students"
                ? "bg-white shadow-sm text-neutral-950 font-medium"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-gray-300/30"
            }`}
          >
            Students
            {/* Students ({students.length}) */}
          </button>
          <button
            onClick={() => setActiveTab("teachers")}
            className={`flex-1 h-7 rounded-2xl flex items-center justify-center text-sm arimo-font transition-all ${
              activeTab === "teachers"
                ? "bg-white shadow-sm text-neutral-950 font-medium"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-gray-300/30"
            }`}
          >
            Teachers
            {/* Teachers ({teachers.length}) */}
          </button>
        </div>

        {/* Tables */}
        {activeTab === "students" ? (
          <div className="flex-1 flex flex-col justify-between">
            <StudentTable data={filteredData} onDelete={confirmDelete} />
            <Pagination
              currentPage={studentPage}
              totalPages={studentProfiles?.total_pages || 1}
              onPageChange={setStudentPage}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <TeacherTable
              data={filteredData}
              onView={handleTeacherView}
              onDelete={confirmDelete}
            />
            <Pagination
              currentPage={teacherPage}
              totalPages={teacherProfiles?.total_pages || 1}
              onPageChange={setTeacherPage}
            />
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="py-20 text-center text-gray-500 arimo-font w-full">
            No users found matching your search.
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        type={activeTab}
        onAdd={handleAddUser}
      />
    </div>
  );
};

export default User;
