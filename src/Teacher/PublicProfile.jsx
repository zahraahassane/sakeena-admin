import { Link } from "react-router-dom";
import defaultProfileImg from "../assets/images/profile.jpg";

import { Loader2 } from "lucide-react";
import { useGetTeacherProfileMeQuery } from "../Api/adminApi";

export default function PublicProfile() {
  const { data: profile, isLoading, error } = useGetTeacherProfileMeQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error loading profile. Please try again later.
      </div>
    );
  }

  const educationList = Array.isArray(profile?.education)
    ? profile.education
    : typeof profile?.education === "string"
      ? profile.education.split("\n").filter((item) => item.trim() !== "")
      : [];

  const achievementsList = Array.isArray(profile?.achievements)
    ? profile.achievements
    : typeof profile?.achievements === "string"
      ? profile.achievements.split("\n").filter((item) => item.trim() !== "")
      : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-6 py-8 bg-white rounded-lg shadow-md border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <img
              src={profile?.profile_picture || defaultProfileImg}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {profile?.user?.first_name} {profile?.user?.last_name}
              </h1>
              <p className="text-teal-600 font-medium">
                {profile?.professional_title}
              </p>
              <div className="flex gap-4 mt-3">
                <a
                  href={`mailto:${profile?.user?.email}`}
                  className="text-sm text-teal-600 hover:underline"
                >
                  {profile?.user?.email}
                </a>
              </div>
            </div>
          </div>
          {/* <Link to={"/teacher/edit-profile"}>
            <button className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-all font-medium">
              Edit Profile
            </button>
          </Link> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8">
        {/* About Section */}
        <section className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">About</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {profile?.about}
          </p>
        </section>

        {/* Education Section */}
        <section className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Education</h2>
          <div className="space-y-4">
            {educationList.length > 0 ? (
              educationList.map((edu, index) => (
                <div
                  key={index}
                  className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-teal-700 font-bold">🎓</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <h3 className="font-bold text-gray-800">{edu}</h3>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">
                No education details added.
              </p>
            )}
          </div>
        </section>

        {/* Achievements Section */}
        <section className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Achievements & Credentials
          </h2>
          <div className="space-y-3">
            {achievementsList.length > 0 ? (
              achievementsList.map((achievement, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <span className="text-green-500 font-bold mt-1">✓</span>
                  <span className="text-gray-700">{achievement}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No achievements added.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
