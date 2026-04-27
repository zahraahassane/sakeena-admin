import { useState, useRef, useEffect } from "react";
import {
  X,
  Video,
  FileText,
  HelpCircle,
  BookOpen,
  UploadCloud,
  Loader2,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import AssignmentForm from "./AssignmentForm";
import QuizForm from "./QuizForm";
import {
  useCreateModuleLessonMutation,
  useUpdateModuleLessonMutation,
  useGetLessonDetailsQuery,
  useLazyGetVideoStatusQuery,
  useCreateLessonQuizMutation,
  useUpdateLessonQuizMutation,
  useCreateLessonQuizQuestionMutation,
  useCreateLessonAssignmentMutation,
  useUpdateLessonAssignmentMutation,
} from "../../Api/adminApi";

const AddLesson = ({ isOpen, onClose, courseId, moduleId, lessonId }) => {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("video");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  
  // New fields for Live
  const [liveDate, setLiveDate] = useState("");
  const [liveTime, setLiveTime] = useState("");
  
  // New fields from backend schema
  const [duration, setDuration] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isReleased, setIsReleased] = useState(true);

  const [assignmentData, setAssignmentData] = useState({
    description: "",
    instructions: "",
    dueDate: "",
    maxPoints: 100,
    maxFileSize: 10,
    allowedFileTypes: "pdf, docx",
  });
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [quizData, setQuizData] = useState({
    timeLimit: 30,
    passingScore: 70,
    description: "",
    questions: [],
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState(null); // null, 'uploading', 'processing', 'ready', 'error'
  const [existingFileUrl, setExistingFileUrl] = useState(null);

  // API hooks
  const [createLesson] = useCreateModuleLessonMutation();
  const [updateLesson] = useUpdateModuleLessonMutation();
  const { data: lessonDetails, isLoading: isLoadingDetails } = useGetLessonDetailsQuery({
    course_pk: courseId,
    module_pk: moduleId,
    id: lessonId
  }, { skip: !lessonId || !isOpen, refetchOnMountOrArgChange: true });
  
  const [getVideoStatus] = useLazyGetVideoStatusQuery();
  const [createQuiz] = useCreateLessonQuizMutation();
  const [updateQuiz] = useUpdateLessonQuizMutation();
  const [createQuizQuestion] = useCreateLessonQuizQuestionMutation();
  const [createAssignment] = useCreateLessonAssignmentMutation();
  const [updateAssignment] = useUpdateLessonAssignmentMutation();

  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (lessonDetails && lessonId) {
      setTitle(lessonDetails.title || "");
      setContentType(lessonDetails.content_type || "video");
      setLink(lessonDetails.content || "");
      setDuration(lessonDetails.duration_in_minutes || "");
      setIsPreview(lessonDetails.is_preview || false);
      setIsReleased(lessonDetails.is_released ?? true);
      setIsDownloadable(lessonDetails.is_downloadable || false);
      
      if (lessonDetails.content_type === "video") {
        setExistingFileUrl(lessonDetails.video_content || null);
      } else if (lessonDetails.content_type === "document") {
        setExistingFileUrl(lessonDetails.file_content || null);
      } else {
        setExistingFileUrl(null);
      }

      if (lessonDetails.scheduled_at) {
        const dt = new Date(lessonDetails.scheduled_at);
        setLiveDate(dt.toISOString().split('T')[0]);
        setLiveTime(dt.toTimeString().split(' ')[0].slice(0, 5));
      }

      if (lessonDetails.assignment_details) {
        const ad = lessonDetails.assignment_details;
        setAssignmentData({
          description: ad.description || "",
          instructions: ad.instructions || "",
          dueDate: ad.due_date ? ad.due_date.split('T')[0] : "",
          maxPoints: ad.max_points || 100,
          maxFileSize: ad.max_file_size || 10,
          allowedFileTypes: ad.allowed_file_types || "pdf, docx",
        });
      }

      if (lessonDetails.quiz_details) {
        const qd = lessonDetails.quiz_details;
        setQuizData({
          timeLimit: qd.time_limit || 30,
          passingScore: qd.passing_score || 70,
          description: qd.description || "",
          questions: (qd.questions || []).map(q => ({
            id: q.id,
            text: q.text,
            points: q.points || 10,
            options: (q.options || []).map(o => o.text),
            correctAnswer: (q.options || []).findIndex(o => o.is_correct)
          })),
        });
      }
    } else if (isOpen && !lessonId) {
      resetForm();
      setIsDownloadable(false);
    }
  }, [lessonDetails, isOpen, lessonId]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const contentTypes = [
    {
      id: "video",
      label: "Video",
      icon: <Video className="w-5 h-5 text-blue-600" />,
      activeClass: "bg-blue-50 border-blue-500 text-blue-700",
      baseClass: "border-stone-200 text-stone-600",
    },
    {
      id: "document",
      label: "Document",
      icon: <FileText className="w-5 h-5 text-amber-600" />,
      activeClass: "bg-amber-50 border-amber-500 text-amber-700",
      baseClass: "border-stone-200 text-stone-600",
    },
    {
      id: "quiz",
      label: "Quiz",
      icon: <HelpCircle className="w-5 h-5 text-purple-600" />,
      activeClass: "bg-purple-50 border-purple-500 text-purple-700",
      baseClass: "border-stone-200 text-stone-600",
    },
    {
      id: "assignment",
      label: "Assignment",
      icon: <BookOpen className="w-5 h-5 text-orange-600" />,
      activeClass: "bg-orange-50 border-orange-500 text-orange-700",
      baseClass: "border-stone-200 text-stone-600",
    },
    {
      id: "live",
      label: "Live Session",
      icon: <Video className="w-5 h-5 text-red-600" />,
      activeClass: "bg-red-50 border-red-500 text-red-700",
      baseClass: "border-stone-200 text-stone-600",
    },
    {
      id: "external_link",
      label: "External Link",
      icon: <ExternalLink className="w-5 h-5 text-teal-600" />,
      activeClass: "bg-teal-50 border-teal-500 text-teal-700",
      baseClass: "border-stone-200 text-stone-600",
    },
  ];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e);
  };

  const startPolling = (lessonId) => {
    setVideoStatus('processing');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await getVideoStatus({ 
          course_pk: courseId, 
          module_pk: moduleId, 
          id: lessonId 
        });
        if (data?.bunny_video_status === "ready") {
          setVideoStatus('ready');
          clearInterval(pollingIntervalRef.current);
          toast.success("Video is ready!");
        } else if (data?.bunny_video_status === "failed") {
          setVideoStatus('error');
          clearInterval(pollingIntervalRef.current);
          toast.error("Video processing failed.");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 10000); // 10 seconds
  };

  const mapQuizDataToBackend = (data, lessonTitle) => {
    return {
      title: lessonTitle,
      time_limit: parseInt(data.timeLimit) || 30,
      passing_score: parseInt(data.passingScore) || 70,
      description: data.description || "",
      questions: (data.questions || []).map(q => {
        const mappedQ = {
          text: q.text,
          points: parseInt(q.points) || 10,
          options: (q.options || []).map((opt, idx) => ({
            text: opt,
            is_correct: parseInt(q.correctAnswer) === idx
          }))
        };
        // If it has a real DB ID (not a frontend Date.now() timestamp), include it
        if (q.id && q.id < 1000000000) {
          mappedQ.id = q.id;
        }
        return mappedQ;
      })
    };
  };

  const mapAssignmentDataToBackend = (data) => {
    return {
      description: data.description || "",
      instructions: data.instructions || "",
      due_date: data.dueDate ? `${data.dueDate}T23:59:00Z` : null,
      max_points: parseInt(data.maxPoints) || 100,
      allowed_file_types: data.allowedFileTypes || "pdf, docx",
      max_file_size: parseInt(data.maxFileSize) || 10
    };
  };

  const handleSubmit = async () => {
    if (isUploading) return;
    if (!title.trim()) {
      toast.error("Please enter a lesson title");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const payload = new FormData();
      payload.append("title", title);
      payload.append("content_type", contentType);
      payload.append("duration_in_minutes", duration || 0);
      payload.append("is_preview", isPreview);
      payload.append("is_released", isReleased);
      
      if (contentType === "document") {
        payload.append("is_downloadable", isDownloadable);
      }

      if (contentType === "live") {
        payload.append("scheduled_at", `${liveDate}T${liveTime}:00Z`);
      } else if (contentType === "external_link") {
        payload.append("content", link);
      } else if (file) {
        payload.append("file_content", file);
      } else if (existingFileUrl && (contentType === "video" || contentType === "document")) {
         // If we have an existing URL and no new file, we don't append file_content
         // unless the backend requires it. Usually PATCH only updates what's provided.
      }

      let resLesson;
      if (lessonId) {
        resLesson = await updateLesson({ 
          course_pk: courseId, 
          module_pk: moduleId, 
          id: lessonId, 
          body: payload 
        }).unwrap();
      } else {
        resLesson = await createLesson({ 
          course_pk: courseId, 
          module_pk: moduleId, 
          body: payload 
        }).unwrap();
      }

      const activeLessonId = lessonId || resLesson.id;

      // Handle special content types (Quiz/Assignment)
      if (contentType === "quiz") {
        const quizPayload = {
          title: title,
          time_limit: parseInt(quizData.timeLimit) || 30,
          passing_score: parseInt(quizData.passingScore) || 70,
          description: quizData.description || "",
        };

        if (lessonId && lessonDetails?.quiz_details) {
          const quizPk = lessonDetails.quiz_details.id;
          await updateQuiz({ 
            course_pk: courseId, 
            module_pk: moduleId, 
            lesson_pk: activeLessonId, 
            id: quizPk, 
            body: quizPayload 
          }).unwrap();

          // Process questions separately
          for (const q of quizData.questions) {
            const questionBody = {
              text: q.text,
              points: parseInt(q.points) || 10,
              options: (q.options || []).map((opt, idx) => ({
                text: opt,
                is_correct: parseInt(q.correctAnswer) === idx
              })),
              quiz: quizPk
            };

            // If it's a new question (front-end generated ID), POST it
            if (!q.id || q.id > 1000000000) {
              await createQuizQuestion({
                course_pk: courseId,
                module_pk: moduleId,
                lesson_pk: activeLessonId,
                quiz_pk: quizPk,
                body: questionBody
              }).unwrap();
            }
            // Note: Update logic for existing questions could go here if endpoint exists
          }
        } else {
          // For fresh creation, we can still use the nested approach if the backend supports it,
          // or create quiz first then questions. Existing createQuiz mapper handles nested.
          const fullQuizPayload = mapQuizDataToBackend(quizData, title);
          await createQuiz({ 
            course_pk: courseId, 
            module_pk: moduleId, 
            lesson_pk: activeLessonId, 
            body: fullQuizPayload 
          }).unwrap();
        }
      } else if (contentType === "assignment") {
        const assignmentPayload = mapAssignmentDataToBackend(assignmentData);
        if (lessonId && lessonDetails?.assignment_details) {
          await updateAssignment({ 
            course_pk: courseId, 
            module_pk: moduleId, 
            lesson_pk: activeLessonId, 
            id: lessonDetails.assignment_details.id, 
            body: assignmentPayload 
          }).unwrap();
        } else {
          await createAssignment({ 
            course_pk: courseId, 
            module_pk: moduleId, 
            lesson_pk: activeLessonId, 
            body: assignmentPayload 
          }).unwrap();
        }
      } else if (contentType === "video" && file && !lessonId) {
        // Only trigger special video flow on initial create if file is present
        if (resLesson.video_upload?.upload_url) {
          setVideoStatus('uploading');
          await fetch(resLesson.video_upload.upload_url, {
            method: resLesson.video_upload.upload_method || "PUT",
            headers: resLesson.video_upload.upload_headers || {},
            body: file,
          });
          startPolling(resLesson.id);
          toast.success("Video upload started!");
          // Don't close yet if we want to show progress? Actually let's close for consistency.
        }
      }

      toast.success(lessonId ? "Lesson updated successfully" : "Lesson added successfully");
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.detail || "Failed to save lesson");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContentType("video");
    setLink("");
    setFile(null);
    setLiveDate("");
    setLiveTime("");
    setDuration("");
    setIsPreview(false);
    setIsReleased(true);
    setAssignmentData({
      description: "",
      instructions: "",
      dueDate: "",
      maxPoints: 100,
      maxFileSize: 10,
      allowedFileTypes: "pdf, docx",
    });
    setQuizData({
      timeLimit: 30,
      passingScore: 70,
      description: "",
      questions: [],
    });
    setVideoStatus(null);
    setExistingFileUrl(null);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-8 bg-gradient-to-br from-teal-600 to-teal-800 text-white relative">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black arimo-font tracking-tight">
                {lessonId ? "Edit Lesson" : "Add New Lesson"}
              </h2>
              <p className="text-white/80 mt-1 font-medium inter-font">
                {lessonId ? "Update existing lesson content" : "Create engaging course materials"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {isLoadingDetails && (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
               <p className="text-stone-500 font-medium animate-pulse">Fetching lesson details...</p>
             </div>
          )}
          
          {!isLoadingDetails && (
            <>
              {/* Status Alert for processing video */}
              {videoStatus && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
                  videoStatus === 'ready' ? 'bg-green-50 text-green-700' : 
                  videoStatus === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {videoStatus === 'processing' || videoStatus === 'uploading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : videoStatus === 'ready' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm font-bold">
                    {videoStatus === 'uploading' && "Uploading video file..."}
                    {videoStatus === 'processing' && "Video is processing. This may take a few minutes."}
                    {videoStatus === 'ready' && "Video is ready and available for students."}
                    {videoStatus === 'error' && "There was an error processing your video."}
                  </span>
                </div>
              )}

              {/* Lesson Title & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${(contentType === "video" || contentType === "live" || contentType === "external_link") ? "md:col-span-2" : "md:col-span-3"} space-y-3`}>
                  <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Introduction to React"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
                  />
                </div>
                {(contentType === "video" || contentType === "live" || contentType === "external_link") && (
                  <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                    <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 45"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
                    />
                  </div>
                )}
              </div>

              {/* Visibility & Preview Settings */}
              <div className="flex flex-wrap gap-6 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isReleased}
                      onChange={(e) => setIsReleased(e.target.checked)}
                      className="peer hidden"
                    />
                    <div className="w-12 h-6 bg-stone-200 rounded-full peer-checked:bg-teal-500 transition-all shadow-inner"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6 shadow-sm"></div>
                  </div>
                  <span className="text-sm font-bold text-stone-700 group-hover:text-stone-900 transition-colors">
                    Available to Students (Released)
                  </span>
                </label>

                {(contentType === "video" || contentType === "document" || contentType === "external_link") && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isPreview}
                        onChange={(e) => setIsPreview(e.target.checked)}
                        className="peer hidden"
                      />
                      <div className="w-12 h-6 bg-stone-200 rounded-full peer-checked:bg-amber-500 transition-all shadow-inner"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6 shadow-sm"></div>
                    </div>
                    <span className="text-sm font-bold text-stone-700 group-hover:text-stone-900 transition-colors">
                      Free Preview
                    </span>
                  </label>
                )}

                {contentType === "document" && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isDownloadable}
                        onChange={(e) => setIsDownloadable(e.target.checked)}
                        className="peer hidden"
                      />
                      <div className="w-12 h-6 bg-stone-200 rounded-full peer-checked:bg-blue-500 transition-all shadow-inner"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6 shadow-sm"></div>
                    </div>
                    <span className="text-sm font-bold text-stone-700 group-hover:text-stone-900 transition-colors">
                      Allow Download
                    </span>
                  </label>
                )}
              </div>

              {/* Content Type - Disabled in edit mode? Usually better to keep it editable but be careful */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
                  Content Type
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {contentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setContentType(type.id)}
                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
                        contentType === type.id
                          ? type.activeClass
                          : type.baseClass +
                            " hover:border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl transition-transform group-active:scale-90 ${contentType === type.id ? "bg-white" : "bg-stone-100"}`}
                      >
                        {type.icon}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold arimo-font whitespace-nowrap">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type-Specific Fields */}
              {contentType === "external_link" && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://example.com/resource"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-blue-600 inter-font"
                  />
                </div>
              )}

              {contentType === "live" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
                      Session Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={liveDate}
                        onChange={(e) => setLiveDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
                      />
                      <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
                      Session Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={liveTime}
                        onChange={(e) => setLiveTime(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
                      />
                      <Clock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {contentType === "assignment" ? (
                <AssignmentForm
                  data={assignmentData}
                  onChange={setAssignmentData}
                />
              ) : contentType === "quiz" ? (
                <QuizForm data={quizData} onChange={setQuizData} />
              ) : contentType !== "external_link" && contentType !== "live" ? (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
                    {lessonId ? "Update" : "Upload"}{" "}
                    {contentType.charAt(0).toUpperCase() + contentType.slice(1)}{" "}
                    File
                  </label>

                  {existingFileUrl && !file ? (
                    <div className="flex items-center justify-between p-6 bg-teal-50/30 border border-teal-100 rounded-[2rem] animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                          {contentType === "video" ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-teal-900 line-clamp-1 max-w-[250px]">
                            {existingFileUrl.split('/').pop()}
                          </h4>
                          <a href={existingFileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-teal-600 font-bold uppercase tracking-wider hover:underline flex items-center gap-1 mt-1">
                            View Current File <ExternalLink className="w-2 h-2" />
                          </a>
                        </div>
                      </div>
                      <button 
                        onClick={() => setExistingFileUrl(null)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-teal-200 text-teal-600 rounded-xl text-xs font-bold hover:bg-teal-50 transition-all shadow-sm active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        <span>Update File</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-[2rem] transition-all group cursor-pointer relative ${
                        isDragging 
                          ? "border-teal-500 bg-teal-50/20 scale-[1.02]" 
                          : "border-stone-200 hover:border-teal-400 hover:bg-teal-50/10"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept={contentType === "video" ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx,.odp,.key"}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform mb-4 shadow-sm border ${
                          isDragging ? "bg-white border-teal-200 scale-110" : "bg-stone-50 border-stone-100 group-hover:scale-110"
                        }`}>
                          <UploadCloud className={`w-8 h-8 transition-colors ${
                            isDragging ? "text-teal-500" : "text-stone-400 group-hover:text-teal-500"
                          }`} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-stone-900 font-bold arimo-font">
                            {file ? file.name : (lessonId ? "Update Document File / Update Video File" : "Click to upload or drag and drop")}
                          </h4>
                          <p className="text-stone-400 text-sm font-medium inter-font">
                            {contentType === "video"
                              ? "MP4, MOV (max 500MB)"
                              : "PDF, DOCX, PPTX (max 10MB)"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-stone-600 font-bold hover:bg-stone-200 transition-all arimo-font"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || isLoadingDetails}
            className="px-8 py-3 bg-greenTeal hover:bg-teal-700 text-white rounded-xl font-black shadow-lg shadow-teal-900/10 active:scale-95 transition-all arimo-font flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Working...</span>
              </>
            ) : (
              <>
                <span>{lessonId ? "Update Lesson" : "Add Lesson"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLesson;
