import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Briefcase,
  ShieldCheck,
  Lock,
  MapPin,
  Plus,
  Trash2,
  GraduationCap,
  Award,
  DollarSign,
  Upload,
  Globe,
  CheckCircle2,
  History,
} from "lucide-react";
import {
  useAddStudentProfileMutation,
  useAddTeacherProfileMutation,
  useUpdateTeacherProfileMutation,
} from "../../Api/adminApi";
import toast from "react-hot-toast";
import PhoneInput from "@/components/ui/phone-input";

const AddUserModal = ({ isOpen, onClose, type, onAdd }) => {
  const [addStudentProfile, { isLoading: isAddingStudent }] =
    useAddStudentProfileMutation();
  const [addTeacherProfile, { isLoading: isAddingTeacher }] =
    useAddTeacherProfileMutation();
  const [updateTeacherProfile, { isLoading: isUpdatingTeacher }] =
    useUpdateTeacherProfileMutation();

  // --- Student Specific State ---
  const [studentData, setStudentData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  // --- Teacher Specific State ---
  const [teacherData, setTeacherData] = useState({
    first_name: "",
    last_name: "",
    professionalTitle: "",
    email: "",
    password: "",
    location: "",
    about: "",
    specialties: [],
    education: {
      degree: "",
      institution: "",
    },
    achievements: [],
    consultationRate: "0",
    profileImage: null,
    offersConsultations: false,
  });

  const fileInputRef = React.useRef(null);

  // Helper states for adding new items
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newAchievement, setNewAchievement] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeacherData({ ...teacherData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Reset states when type changes
    if (type === "students") {
      setStudentData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
      });
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  // --- Form Handlers ---
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await addStudentProfile({
        user: {
          email: studentData.email,
          password: studentData.password,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
        },
        // Optional. The API rejects an empty string, so leave it out when blank.
        ...(studentData.phone_number.trim() && {
          phone_number: studentData.phone_number.trim(),
        }),
      }).unwrap();

      onAdd({
        ...response,
        role: "student",
        courses: 0,
        joined: new Date().toISOString().split("T")[0],
      });

      setStudentData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
      });

      onClose();
    } catch (error) {
      console.error("Failed to create student:", error);
      // Handle error - you can show a toast notification here
    }
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();

    // Validate consultation_rate
    const rate = parseFloat(teacherData.consultationRate) || 0;
    if (rate < 0) {
      toast.error("Consultation rate cannot be negative");
      return;
    }

    try {
      // Step 1: Create teacher profile with JSON data (no image)
      const teacherJsonData = {
        user: {
          email: teacherData.email,
          password: teacherData.password,
          first_name: teacherData.first_name,
          last_name: teacherData.last_name,
        },
        professional_title: teacherData.professionalTitle,
        location: teacherData.location,
        about: teacherData.about,
        education:
          teacherData.education.degree && teacherData.education.institution
            ? `${teacherData.education.degree} — ${teacherData.education.institution}`
            : "",
        achievements: teacherData.achievements,
        consultation_rate: rate,
        offers_consultations: rate > 0,
      };

      console.log("=== Step 1: Creating teacher with JSON data ===");
      console.log("JSON Data:", teacherJsonData);

      const createResult = await addTeacherProfile(teacherJsonData).unwrap();
      console.log("Teacher created successfully:", createResult);

      // Step 2: If there's an image, update the profile with the image
      if (
        teacherData.profileImage &&
        teacherData.profileImage !== createResult.profile_picture
      ) {
        console.log("=== Step 2: Uploading profile image ===");

        const imageFormData = new FormData();

        if (teacherData.profileImage.startsWith("data:")) {
          // Convert base64 to file
          const response = await fetch(teacherData.profileImage);
          const blob = await response.blob();
          imageFormData.append("profile_picture", blob, "profile.jpg");
        } else if (teacherData.profileImage instanceof File) {
          imageFormData.append("profile_picture", teacherData.profileImage);
        }

        console.log("Image FormData:", imageFormData.get("profile_picture"));

        const updateResult = await updateTeacherProfile({
          id: createResult.id,
          body: imageFormData,
        }).unwrap();

        console.log("Image uploaded successfully:", updateResult);

        // Use the updated result for onAdd
        onAdd({
          ...updateResult,
          role: "teacher",
          courses: 0,
          students: 0,
          joined: new Date().toISOString().split("T")[0],
        });
      } else {
        // No image to upload, use the create result
        onAdd({
          ...createResult,
          role: "teacher",
          courses: 0,
          students: 0,
          joined: new Date().toISOString().split("T")[0],
        });
      }

      // Reset teacher data
      setTeacherData({
        first_name: "",
        last_name: "",
        professionalTitle: "",
        email: "",
        password: "",
        location: "",
        about: "",
        specialties: [],
        education: {
          degree: "",
          institution: "",
        },
        achievements: [],
        consultationRate: "0",
        profileImage: null,
        offersConsultations: false,
      });

      toast.success("Teacher created successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to create teacher:", error);
      toast.error("Failed to create teacher. Please try again.");
    }
  };

  // --- Teacher UI Components ---
  const SpecialtyTag = ({ text, onRemove }) => (
    <div className="h-6 px-3 bg-[#89A6A7] rounded-lg flex items-center gap-2 group">
      <span className="text-white text-xs font-medium arimo-font">{text}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-white hover:text-white/70"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  if (type === "students") {
    // Simple Student Modal (keeping existing working logic but updating aesthetic)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-black/5 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-neutral-900 text-xl font-bold arimo-font">
              Add New Student
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-greenTeal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            onSubmit={handleStudentSubmit}
            className="p-6 flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 ml-1">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Abdullah"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A6A7]/20 focus:border-[#89A6A7] transition-all text-sm"
                  value={studentData.first_name}
                  onChange={(e) =>
                    setStudentData({
                      ...studentData,
                      first_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 ml-1">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Rahman"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A6A7]/20 focus:border-[#89A6A7] transition-all text-sm"
                  value={studentData.last_name}
                  onChange={(e) =>
                    setStudentData({
                      ...studentData,
                      last_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="e.g. abdullah@example.com"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A6A7]/20 focus:border-[#89A6A7] transition-all text-sm"
                  value={studentData.email}
                  onChange={(e) =>
                    setStudentData({ ...studentData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 ml-1">
                Phone Number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <PhoneInput
                placeholder="Enter phone number"
                value={studentData.phone_number}
                onChange={(phone_number) =>
                  setStudentData((prev) => ({ ...prev, phone_number }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#89A6A7]/20 focus:border-[#89A6A7] transition-all text-sm"
                  value={studentData.password}
                  onChange={(e) =>
                    setStudentData({ ...studentData, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 border border-black/10 rounded-xl text-sm font-medium text-neutral-600 hover:bg-gray-50 disabled:opacity-50"
                disabled={isAddingStudent}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingStudent}
                className="flex-[2] h-11 bg-[#89A6A7] text-white rounded-xl text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingStudent ? "Creating..." : "Create Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- TEACHER INTERFACE (COMPLEX) ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-[1168px] h-[90vh] bg-white rounded-xl shadow-2xl overflow-y-auto no-scrollbar border border-black/10 relative">
        {/* Banner/Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-8 py-6 border-b border-black/5 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#89A6A7] text-3xl font-bold inter-font leading-9">
              Teacher Profile
            </h1>
            <p className="text-gray-600 text-base font-normal inter-font leading-6">
              Manage what students see on your profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-greenTeal group-hover:text-black" />
          </button>
        </div>

        <form
          onSubmit={handleTeacherSubmit}
          className="p-8 flex flex-col gap-6 max-w-[1120px] mx-auto"
        >
          {/* Section 1: Profile Header */}
          <div className="w-full bg-white rounded-2xl border border-black/10 p-8 flex flex-col gap-6 shadow-sm">
            <h3 className="text-greenTeal text-base font-medium inter-font">
              Profile Header
            </h3>

            <div className="flex flex-col gap-8">
              {/* Photo Upload area */}
              <div className="flex items-center gap-8">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <div className="w-32 h-32 bg-[#89A6A7] rounded-full flex items-center justify-center text-white text-3xl font-normal inter-font overflow-hidden border-2 border-[#89A6A7]/20">
                  {teacherData.profileImage ? (
                    <img
                      src={teacherData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "FR"
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="w-[176px] h-9 bg-[#89A6A7] rounded-lg text-white text-sm font-medium inter-font hover:bg-[#729394] transition-colors"
                  >
                    Upload Profile Photo
                  </button>
                  <p className="text-gray-500 text-xs font-normal inter-font">
                    Professional photo recommended (JPG, PNG - Max. 5MB)
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full h-11 px-4 bg-zinc-100 rounded-lg border-transparent focus:outline-none focus:ring-1 focus:ring-[#89A6A7] text-sm"
                    placeholder="e.g. Fatima"
                    value={teacherData.first_name}
                    onChange={(e) =>
                      setTeacherData({
                        ...teacherData,
                        first_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                {/* Last Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full h-11 px-4 bg-zinc-100 rounded-lg border-transparent focus:outline-none focus:ring-1 focus:ring-[#89A6A7] text-sm"
                    placeholder="e.g. Rahman"
                    value={teacherData.last_name}
                    onChange={(e) =>
                      setTeacherData({
                        ...teacherData,
                        last_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                {/* Prof Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    className="w-full h-11 px-4 bg-zinc-100 rounded-lg border-transparent text-sm"
                    placeholder="Clinical Psychologist & Islamic Scholar"
                    value={teacherData.professionalTitle}
                    onChange={(e) =>
                      setTeacherData({
                        ...teacherData,
                        professionalTitle: e.target.value,
                      })
                    }
                  />
                </div>
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    Public Email
                  </label>
                  <input
                    type="email"
                    className="w-full h-11 px-4 bg-zinc-100 rounded-lg border-transparent text-sm"
                    placeholder="Learner@Sakeena.edu"
                    value={teacherData.email}
                    onChange={(e) =>
                      setTeacherData({ ...teacherData, email: e.target.value })
                    }
                    required
                  />
                </div>
                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full h-11 px-4 bg-zinc-100 rounded-lg border-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#89A6A7]"
                    placeholder="Enter password"
                    value={teacherData.password || ""}
                    onChange={(e) =>
                      setTeacherData({
                        ...teacherData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                {/* Location */}
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full h-11 px-4 bg-zinc-100 rounded-lg border-transparent text-sm"
                    placeholder="London, UK"
                    value={teacherData.location}
                    onChange={(e) =>
                      setTeacherData({
                        ...teacherData,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: About */}
          <div className="w-full bg-white rounded-2xl border border-black/10 p-8 flex flex-col gap-6 shadow-sm">
            <h3 className="text-greenTeal text-base font-medium inter-font">
              About Me
            </h3>

            <div className="flex flex-col gap-2">
              <textarea
                className="w-full min-h-[120px] p-4 bg-zinc-100 rounded-lg border-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#89A6A7]"
                placeholder="Introduce yourself, your experience, and expertise..."
                value={teacherData.about}
                onChange={(e) =>
                  setTeacherData({ ...teacherData, about: e.target.value })
                }
              ></textarea>
              <p className="text-gray-500 text-xs font-normal inter-font">
                {teacherData.about.length} characters
              </p>
            </div>
          </div>

          {/* Section 3: Specialties & Tags */}
          <div className="w-full bg-white rounded-2xl border border-black/10 p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#89A6A7]" />
              <h3 className="text-greenTeal text-base font-medium inter-font">
                Specialties & Tags
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {teacherData.specialties.map((s, i) => (
                  <SpecialtyTag
                    key={i}
                    text={s}
                    onRemove={() =>
                      setTeacherData({
                        ...teacherData,
                        specialties: teacherData.specialties.filter(
                          (_, idx) => idx !== i,
                        ),
                      })
                    }
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 h-9 px-4 bg-zinc-100 rounded-lg border-transparent text-sm"
                  placeholder="Add a specialty tag (e.g., Anxiety Psychology)"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newSpecialty) {
                        setTeacherData({
                          ...teacherData,
                          specialties: [
                            ...teacherData.specialties,
                            newSpecialty,
                          ],
                        });
                        setNewSpecialty("");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSpecialty) {
                      setTeacherData({
                        ...teacherData,
                        specialties: [...teacherData.specialties, newSpecialty],
                      });
                      setNewSpecialty("");
                    }
                  }}
                  className="w-10 h-9 bg-[#89A6A7] rounded-lg flex items-center justify-center text-white"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Education */}
          <div className="w-full bg-white rounded-2xl border border-black/10 p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#89A6A7]" />
              <h3 className="text-greenTeal text-base font-medium inter-font">
                Education
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    Degree
                  </label>
                  <input
                    type="text"
                    className="h-11 px-4 bg-zinc-100 rounded-lg border-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#89A6A7]"
                    placeholder="e.g., PhD in Psychology"
                    value={teacherData.education.degree}
                    onChange={(e) =>
                      setTeacherData({
                        ...teacherData,
                        education: {
                          ...teacherData.education,
                          degree: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-950 text-sm font-medium inter-font">
                    Institution
                  </label>
                  <input
                    type="text"
                    className="h-11 px-4 bg-zinc-100 rounded-lg border-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[#89A6A7]"
                    placeholder="e.g., Harvard University"
                    value={teacherData.education.institution}
                    onChange={(e) =>
                      setTeacherData({
                        ...teacherData,
                        education: {
                          ...teacherData.education,
                          institution: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Achievements & Credentials */}
          <div className="w-full bg-white rounded-2xl border border-black/10 p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#89A6A7]" />
              <h3 className="text-greenTeal text-base font-medium inter-font">
                Achievements & Credentials
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {teacherData.achievements.map((ach, i) => (
                <div
                  key={i}
                  className="px-4 py-3 bg-green-50 rounded-[10px] border border-green-200 flex justify-between items-center group"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-neutral-950 text-sm font-normal inter-font">
                      {ach}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTeacherData({
                        ...teacherData,
                        achievements: teacherData.achievements.filter(
                          (_, idx) => idx !== i,
                        ),
                      })
                    }
                    className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  className="flex-1 h-9 px-4 bg-zinc-100 rounded-lg border-transparent text-sm"
                  placeholder="Add an achievement or credential..."
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newAchievement) {
                        setTeacherData({
                          ...teacherData,
                          achievements: [
                            ...teacherData.achievements,
                            newAchievement,
                          ],
                        });
                        setNewAchievement("");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAchievement) {
                      setTeacherData({
                        ...teacherData,
                        achievements: [
                          ...teacherData.achievements,
                          newAchievement,
                        ],
                      });
                      setNewAchievement("");
                    }
                  }}
                  className="w-10 h-9 bg-[#89A6A7] rounded-lg flex items-center justify-center text-white shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 6: Payment Rates */}
          <div className="w-full bg-gradient-to-br from-[#89A6A7]/10 to-stone-300/20 rounded-[10px] border-2 border-[#89A6A7]/30 p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#89A6A7]" />
                <h3 className="text-neutral-800 text-lg font-bold arimo-font">
                  Payment Rates
                </h3>
              </div>
              {/* <button
                type="button"
                className="h-9 px-4 bg-[#89A6A7] text-white rounded-[10px] text-sm font-normal arimo-font hover:bg-[#729394]"
              >
                Add Rates
              </button> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-[10px] border border-neutral-200 flex flex-col gap-3">
                <span className="text-neutral-600 text-sm font-normal arimo-font">
                  Consultation Hourly Rate
                </span>
                <div className="flex items-center gap-2 text-[#89A6A7] text-3xl font-bold arimo-font">
                  <span className="text-[#89A6A7] text-3xl font-bold arimo-font">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="h-11 px-4 bg-zinc-100 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#89A6A7]"
                    placeholder="Enter hourly rate"
                    value={teacherData.consultationRate}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || parseFloat(value) >= 0) {
                        setTeacherData({
                          ...teacherData,
                          consultationRate: value,
                        });
                      }
                    }}
                  />
                  <span className="text-neutral-500 text-sm font-normal arimo-font">
                    /hour
                  </span>
                </div>
                <p className="text-neutral-500 text-xs font-normal arimo-font italic">
                  Rate for one-on-one consultation sessions
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-[10px] border border-blue-200">
              <div className="flex gap-2">
                <span className="text-blue-800 text-sm font-bold arimo-font">
                  Note:
                </span>
                <p className="text-blue-800 text-sm font-normal arimo-font leading-5">
                  When rate is 0, consultations will be disabled. When rate is
                  greater than 0, consultations will be enabled automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-4 mb-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-10 border border-black/10 rounded-lg text-sm font-normal text-neutral-950 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50"
              disabled={isAddingTeacher || isUpdatingTeacher}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingTeacher || isUpdatingTeacher}
              className="px-8 h-10 bg-[#89A6A7] hover:bg-[#729394] text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-[0.98] inter-font disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingTeacher || isUpdatingTeacher
                ? "Creating..."
                : "Create Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
