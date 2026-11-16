import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  MapPin,
  BookOpen,
  Users,
  Award,
  DollarSign,
  CheckCircle2,
  Edit2,
  Save,
  Loader2,
  Camera,
} from "lucide-react";
import {
  useGetTeacherProfileQuery,
  useUpdateTeacherProfileMutation,
} from "../../Api/adminApi";
import toast from "react-hot-toast";

const TeacherDetails = ({ teacher, onBack }) => {
  const { data, isLoading, isError } = useGetTeacherProfileQuery(teacher?.id, {
    skip: !teacher?.id,
  });
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateTeacherProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    professional_title: "",
    location: "",
    about: "",
    education: "",
    consultation_rate: "",
    offers_consultations: false,
    specialties: "",
    achievements: "",
    first_name: "",
    last_name: "",
    profile_picture: null,
    profilePicturePreview: "",
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const source = data || teacher?.raw;
    if (source && !isEditing) {
      setFormData({
        professional_title: source.professional_title || source.professionalTitle || "",
        location: source.location || "",
        about: source.about || "",
        education: Array.isArray(source.education)
          ? source.education.join("\n")
          : source.education || "",
        consultation_rate: source.consultation_rate || source.consultationRate || "0",
        offers_consultations: Boolean(source.offers_consultations),
        specialties: Array.isArray(source.specialties)
          ? source.specialties.join(", ")
          : "",
        achievements: Array.isArray(source.achievements)
          ? source.achievements.join(", ")
          : "",
        first_name: source.user?.first_name || "",
        last_name: source.user?.last_name || "",
        profile_picture: null,
        profilePicturePreview: source.profile_picture || "",
      });
    }
  }, [data, teacher, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profile_picture: file,
        profilePicturePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    const rate = parseFloat(formData.consultation_rate) || 0;
    if (rate < 0) {
      toast.error("Consultation rate cannot be negative");
      return;
    }
    if (formData.offers_consultations && rate <= 0) {
      toast.error("Set an hourly rate above 0 to offer consultations");
      return;
    }

    try {
      // Step 1: Update text data using JSON
      const jsonData = {
        user: {
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
        professional_title: formData.professional_title,
        location: formData.location,
        about: formData.about,
        consultation_rate: formData.consultation_rate,
        offers_consultations: formData.offers_consultations,
        specialties: formData.specialties
          ? formData.specialties.split(",").map((s) => s.trim())
          : [],
        achievements: formData.achievements
          ? formData.achievements.split(",").map((a) => a.trim())
          : [],
        education: formData.education || "", // Sending as string as per schema/preview
      };

      await updateProfile({
        id: teacher.id,
        data: jsonData,
      }).unwrap();

      // Step 2: If there's a new image file, update it separately using FormData
      if (formData.profile_picture instanceof File) {
        const imageFormData = new FormData();
        imageFormData.append("profile_picture", formData.profile_picture);
        
        await updateProfile({
          id: teacher.id,
          data: imageFormData,
        }).unwrap();
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err?.data?.detail || "Failed to update profile");
    }
  };

  if (!teacher) return null;

  if (isLoading) {
    return (
      <div className="py-20 text-center text-neutral-700">
        Loading teacher details...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-red-600">
        Failed to load teacher details.
      </div>
    );
  }

  const profile = data || teacher.raw || teacher;
  const user = profile.user || {};
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    profile.name ||
    "Teacher";
  const email = user.email || profile.email || "";
  const location = profile.location || "N/A";
  const title = profile.professional_title || profile.department || "Teacher";
  const about = profile.about || "No bio available.";
  const achievements = Array.isArray(profile.achievements)
    ? profile.achievements
    : [];
  const specialties = Array.isArray(profile.specialties)
    ? profile.specialties
    : [];
  const educationItems =
    typeof profile.education === "string"
      ? profile.education.split(/\r?\n/).filter(Boolean)
      : Array.isArray(profile.education)
        ? profile.education.map((item) => {
          if (typeof item === "string") return item;
          if (item.degree && item.institution)
            return `${item.degree} — ${item.institution}`;
          return JSON.stringify(item);
        })
        : [];
  const courses = Array.isArray(profile.courses) ? profile.courses : [];
  const consultationRate =
    profile.consultation_rate || profile.consultationRate || "0";
  const profilePicture = profile.profile_picture || user.profile_picture;
  const imageUrl =
    formData.profilePicturePreview ||
    profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=89A6A7&color=fff&size=512`;

  return (
    <div className="flex flex-col gap-8 pb-10 animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-greenTeal text-3xl font-bold inter-font leading-9">
            Teacher Profile
          </h1>
          <p className="text-gray-600 text-base font-normal inter-font leading-6">
            Manage what students see on your profile
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm ${isEditing
                ? "bg-greenTeal text-white hover:bg-teal-700 shadow-md active:scale-95"
                : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
              }`}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <Save className="w-4 h-4" />
            ) : (
              <Edit2 className="w-4 h-4" />
            )}
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white text-stone-500 border border-stone-200 hover:bg-stone-50 text-sm font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <X className="w-6 h-6 text-neutral-400 group-hover:text-neutral-950" />
          </button>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-[0px_6px_20px_rgba(0,0,0,0.05)] border border-stone-200 p-8 md:p-12">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
          <div className="relative group/avatar">
            <img
              className="w-48 h-48 md:w-52 md:h-52 rounded-full object-cover border-4 border-white shadow-lg"
              src={imageUrl}
              alt={displayName}
            />
            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200"
                >
                  <Camera className="w-10 h-10 text-white" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="text-stone-900 text-4xl font-normal arimo-font border-b border-stone-200 focus:border-greenTeal outline-none bg-transparent w-full"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="text-stone-900 text-4xl font-normal arimo-font border-b border-stone-200 focus:border-greenTeal outline-none bg-transparent w-full"
                    placeholder="Last Name"
                  />
                </div>
              ) : (
                <h2 className="text-stone-900 text-4xl font-normal arimo-font">
                  {displayName}
                </h2>
              )}
              {isEditing ? (
                <input
                  type="text"
                  name="professional_title"
                  value={formData.professional_title}
                  onChange={handleInputChange}
                  className="text-stone-600 text-lg font-normal arimo-font border-b border-stone-200 focus:border-greenTeal outline-none bg-transparent w-full"
                  placeholder="Professional Title"
                />
              ) : (
                <p className="text-stone-600 text-lg font-normal arimo-font">
                  {title}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2 text-zinc-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-normal arimo-font">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600">
                <MapPin className="w-4 h-4" />
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="text-sm font-normal arimo-font border-b border-stone-200 focus:border-greenTeal outline-none bg-transparent"
                    placeholder="Location"
                  />
                ) : (
                  <span className="text-sm font-normal arimo-font">
                    {location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-stone-900 text-lg font-bold">
                  {courses.length}
                </span>
                <span className="text-stone-500 text-sm font-normal">
                  Courses
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Users className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-stone-900 text-lg font-bold">
                  {profile.students ?? 0}
                </span>
                <span className="text-stone-500 text-sm font-normal">
                  Students
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              {isEditing ? (
                <div className="w-full flex flex-col gap-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold ml-1">
                    Specialties (comma separated)
                  </span>
                  <input
                    type="text"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-greenTeal outline-none text-sm font-normal arimo-font"
                    placeholder="e.g. Psychology, Quranic Studies"
                  />
                </div>
              ) : specialties.length > 0 ? (
                specialties.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1 rounded-xl border border-slate-300 text-slate-600 text-xs font-normal arimo-font"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="px-4 py-1 rounded-xl border border-slate-300 text-slate-600 text-xs font-normal arimo-font">
                  No specialties listed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col gap-6 shadow-sm">
        <h3 className="text-stone-900 text-2xl font-normal arimo-font border-b border-stone-100 pb-4">
          About
        </h3>
        <div className="flex flex-col gap-4 text-stone-700 text-base font-normal arimo-font leading-7">
          {isEditing ? (
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              className="w-full min-h-[150px] p-4 rounded-xl border border-stone-200 focus:border-greenTeal outline-none text-base font-normal arimo-font"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p>{about}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col gap-6 shadow-sm">
            <h3 className="text-stone-900 text-2xl font-normal arimo-font border-b border-stone-100 pb-4">
              Education
            </h3>
            <div className="flex flex-col gap-6">
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold ml-1">
                    Education (one per line)
                  </span>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full min-h-[120px] p-4 rounded-xl border border-stone-200 focus:border-greenTeal outline-none text-sm font-normal arimo-font"
                    placeholder="e.g. Master in Psychology — Al-Azhar University"
                  />
                </div>
              ) : educationItems.length > 0 ? (
                educationItems.map((item, idx) => (
                  <div key={idx} className="flex gap-5 items-start">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-stone-900 text-lg font-medium arimo-font">
                        {item}
                      </h4>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-stone-500">
                  No education details available.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
              <div className="p-1 rounded bg-blue-50">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-neutral-950 text-2xl font-normal arimo-font">
                Courses Taught ({courses.length})
              </h3>
            </div>

            <div className="rounded-[10px] border border-black/10 overflow-hidden">
              <table className="w-full text-sm text-left arimo-font">
                <thead className="bg-gray-50 border-b border-black/10">
                  <tr>
                    <th className="py-3 px-4 font-normal text-neutral-950 w-2/3">
                      Course Name
                    </th>
                    <th className="py-3 px-4 font-normal text-neutral-950 text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {courses.length > 0 ? (
                    courses.slice(0, 5).map((course, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-neutral-950 text-base">
                          {course.title}
                        </td>
                        <td className="py-4 px-4 text-neutral-950 text-base text-right font-medium">
                          {course.status || "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-4 px-4 text-neutral-500" colSpan={2}>
                        No courses available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-stone-900 text-lg font-bold arimo-font mb-6 border-b border-stone-100 pb-3">
              Achievements
            </h3>
            <div className="flex flex-col gap-4">
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold ml-1">
                    Achievements (comma separated)
                  </span>
                  <input
                    type="text"
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-greenTeal outline-none text-sm font-normal arimo-font"
                    placeholder="e.g. Best Teacher 2023"
                  />
                </div>
              ) : achievements.length > 0 ? (
                achievements.map((ach, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-stone-700 text-sm font-normal arimo-font leading-relaxed">
                      {ach}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-stone-500">No achievements available.</p>
              )}
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl border-2 border-stone-100 p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <h3 className="text-neutral-800 text-lg font-bold arimo-font">
                  Payment Rates
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col gap-2">
                <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">
                  Consultation Hourly Rate
                </span>
                <div className="flex items-baseline gap-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-3xl font-bold font-['Arimo']">
                        $
                      </span>
                      <input
                        type="number"
                        name="consultation_rate"
                        value={formData.consultation_rate}
                        onChange={handleInputChange}
                        className="w-24 text-slate-500 text-3xl font-bold font-['Arimo'] border-b border-stone-200 focus:border-greenTeal outline-none bg-transparent"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-500 text-3xl font-bold font-['Arimo']">
                      ${consultationRate}
                    </span>
                  )}
                  <span className="text-neutral-400 text-sm">/hour</span>
                </div>
                <p className="text-neutral-400 text-[11px] arimo-font">
                  Rate for one-on-one consultation sessions
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 text-xs font-medium uppercase tracking-wider">
                    Offers Consultations
                  </span>
                  <p className="text-neutral-400 text-[11px] arimo-font">
                    {formData.offers_consultations
                      ? "This teacher is a consultant and can have consultation plans"
                      : "Turn on to make this teacher a consultant"}
                  </p>
                </div>
                {isEditing ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.offers_consultations}
                    aria-label="Offers consultations"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        offers_consultations: !prev.offers_consultations,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      formData.offers_consultations
                        ? "bg-greenTeal"
                        : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        formData.offers_consultations
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      profile.offers_consultations
                        ? "bg-green-50 text-green-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {profile.offers_consultations ? "Yes" : "No"}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <p className="text-blue-800 text-[13px] arimo-font leading-relaxed">
                <span className="font-bold">Note:</span> These rates are
                automatically displayed on the instructor's dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetails;
