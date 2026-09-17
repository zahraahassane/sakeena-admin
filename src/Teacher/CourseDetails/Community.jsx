import CommunityChat from "../../components/CommunityChat";

export default function CourseCommunity({ course }) {
  if (!course?.id) return null;
  return <CommunityChat courseTitle={course.title} courseId={course.id} />;
}
