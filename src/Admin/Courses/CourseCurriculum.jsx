import React, { useState, useRef, useEffect } from "react";
import {
  GripVertical,
  Plus,
  X,
  Video as VideoIcon,
  FileText,
  HelpCircle,
  BookOpen,
  Loader2,
  ExternalLink,
  Zap,
  Save,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from "lucide-react";

import AddContentModal from "./AddLesson";
import LessonDetailsModal from "./LessonDetailsModal";
import {
  useGetCourseModulesQuery,
  useCreateCourseModuleMutation,
  useDeleteCourseModuleMutation,
  useUpdateCourseModuleMutation,
  useGetModuleLessonsQuery,
  useDeleteModuleLessonMutation,
  useReorderModuleLessonsMutation,
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableLessonItem = ({ lesson, mod, onLessonDetails, onEditLesson, handleRemoveLesson }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 1 : 0,
    position: 'relative'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border border-stone-100 rounded-2xl hover:border-teal-200 hover:shadow-md transition-all group"
    >
      <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing outline-none">
        <GripVertical className="w-4 h-4 text-stone-300 opacity-50 group-hover:opacity-100 group-hover:text-teal-400 transition-colors" />
      </div>
      <div
        onClick={() => onLessonDetails(lesson)}
        className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors cursor-pointer"
      >
        {lesson.content_type === "video" ? (
          <VideoIcon className="w-5 h-5" />
        ) : lesson.content_type === "document" ? (
          <FileText className="w-5 h-5" />
        ) : lesson.content_type === "quiz" ? (
          <HelpCircle className="w-5 h-5" />
        ) : lesson.content_type === "assignment" ? (
          <BookOpen className="w-5 h-5" />
        ) : (
          <ExternalLink className="w-5 h-5" />
        )}
      </div>
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onLessonDetails(lesson)}
      >
        <h4 className="text-sm font-bold text-stone-800 arimo-font">
          {lesson.title}
        </h4>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest arimo-font mt-0.5 block">
            {lesson.content_type}
          </span>
          {lesson.duration_in_minutes > 0 && (
            <span className="text-[10px] font-bold text-stone-400 arimo-font mt-0.5 block">
              • {lesson.duration_in_minutes} mins
            </span>
          )}
          {lesson.is_preview && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full uppercase tracking-tighter mt-0.5 ml-2">
              Preview
            </span>
          )}
          {!lesson.is_released && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full uppercase tracking-tighter mt-0.5 ml-2">
              Draft
            </span>
          )}
          {lesson.content_type === "video" &&
            lesson.bunny_video_status && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter mt-0.5 ml-2 ${
                  lesson.bunny_video_status === "ready"
                    ? "bg-green-50 text-green-600"
                    : lesson.bunny_video_status === "failed"
                      ? "bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-600 animate-pulse"
                }`}
              >
                {lesson.bunny_video_status}
              </span>
            )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={() => onEditLesson(mod.id, lesson.id)}
          className="p-2 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
          title="Edit Lesson"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleRemoveLesson(lesson.id)}
          className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Lesson"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ModuleItem = ({
  mod,
  courseId,
  onAddLesson,
  onEditLesson,
  onRemoveModule,
  onLessonDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(mod.title);
  const editInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const { data: lessonsResponse, isLoading: isLoadingLessons } =
    useGetModuleLessonsQuery(
      {
        course_pk: courseId,
        module_pk: mod.id,
        page: page,
      },
      { skip: !isExpanded },
    );

  const [localLessons, setLocalLessons] = useState([]);

  useEffect(() => {
    setLocalLessons(lessonsResponse?.results || []);
  }, [lessonsResponse?.results]);

  const [deleteLesson] = useDeleteModuleLessonMutation();
  const [updateModule, { isLoading: isUpdatingModule }] =
    useUpdateCourseModuleMutation();
  const [reorderLessons] = useReorderModuleLessonsMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localLessons.findIndex((l) => l.id === active.id);
    const newIndex = localLessons.findIndex((l) => l.id === over.id);

    const newLessons = arrayMove(localLessons, oldIndex, newIndex);
    setLocalLessons(newLessons);

    const orderPayload = newLessons.map((l, idx) => ({ id: l.id, order: idx }));
    try {
      await reorderLessons({
        course_pk: courseId,
        module_pk: mod.id,
        order: orderPayload,
      }).unwrap();
      toast.success("Lessons reordered successfully", { id: `reorder-${mod.id}` });
    } catch (err) {
      toast.error("Failed to reorder lessons", { id: `reorder-err-${mod.id}` });
      setLocalLessons(localLessons); // Revert
    }
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setEditTitle(mod.title);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === mod.title) {
      setIsEditing(false);
      setEditTitle(mod.title);
      return;
    }
    try {
      await updateModule({
        course_pk: courseId,
        id: mod.id,
        body: { title: trimmed },
      }).unwrap();
      toast.success("Module renamed");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to rename module");
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(mod.title);
    }
  };

  const handleRemoveLesson = (lessonId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[250px]">
          <div className="flex items-center gap-2 text-stone-800">
            <X className="w-5 h-5 text-red-500" />
            <span className="font-bold arimo-font text-sm">
              Delete this lesson?
            </span>
          </div>
          <p className="text-xs text-stone-500 inter-font">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-stone-600 transition-all rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteLesson({
                    course_pk: courseId,
                    module_pk: mod.id,
                    id: lessonId,
                  }).unwrap();
                  toast.success("Lesson deleted");
                } catch (err) {
                  toast.error("Failed to delete lesson");
                }
              }}
              className="px-4 py-2 text-xs font-bold bg-red-500 text-white hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-center" },
    );
  };

  return (
    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
      {/* Module Header */}
      <div
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        className={`px-8 py-6 border-b border-stone-100 flex items-center justify-between cursor-pointer transition-colors ${
          isExpanded ? "bg-[#D6CBAF33]" : "bg-white hover:bg-stone-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="text-stone-400 group-hover:text-teal-600 transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col">
            {isEditing ? (
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={editInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleSaveEdit}
                  className="text-xl font-bold text-stone-800 arimo-font bg-white border border-teal-300 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  disabled={isUpdatingModule}
                />
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSaveEdit();
                  }}
                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                  title="Save"
                  disabled={isUpdatingModule}
                >
                  {isUpdatingModule ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsEditing(false);
                    setEditTitle(mod.title);
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h3 className="text-xl font-bold text-stone-800 arimo-font">
                {mod.title}
              </h3>
            )}
            <span className="text-xs font-medium text-stone-400 uppercase tracking-widest mt-1">
              Modules Lessons
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleStartEdit}
            className="p-2.5 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
            title="Edit Module Name"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRemoveModule(mod.id)}
            className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Delete Module"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => onAddLesson(mod.id)}
            className="flex items-center gap-2 bg-greenTeal hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lesson</span>
          </button>
        </div>
      </div>

      {/* Lessons List - Collapsible */}
      {isExpanded && (
        <div className="p-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {isLoadingLessons ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
            </div>
          ) : localLessons.length > 0 ? (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={localLessons.map(l => l.id)} 
                strategy={verticalListSortingStrategy}
              >
                {localLessons.map((lesson) => (
                  <SortableLessonItem
                    key={lesson.id}
                    lesson={lesson}
                    mod={mod}
                    onLessonDetails={onLessonDetails}
                    onEditLesson={onEditLesson}
                    handleRemoveLesson={handleRemoveLesson}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="py-8 text-center text-stone-400 text-sm font-medium border-2 border-dashed border-stone-100 rounded-2xl">
              No lessons added yet. Click Add Lesson to start.
            </div>
          )}

          {/* Pagination Controls */}
          {lessonsResponse?.total_pages > 1 && (
            <div className="mt-4 pt-4 border-t border-stone-50">
              <Pagination
                currentPage={page}
                totalPages={lessonsResponse.total_pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CourseCurriculum = ({ courseId, onInitialize }) => {
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // API hooks
  const { data: modulesResponse, isLoading: isLoadingModules } =
    useGetCourseModulesQuery(courseId, {
      skip: !courseId,
    });
  const modules = modulesResponse?.results || modulesResponse || [];

  const [createModule, { isLoading: isCreatingModule }] =
    useCreateCourseModuleMutation();
  const [deleteModule] = useDeleteCourseModuleMutation();

  const addModule = async () => {
    if (isCreatingModule) return; // Prevent double creation
    if (newModuleTitle.trim() && courseId) {
      try {
        await createModule({
          course_pk: courseId,
          body: { title: newModuleTitle.trim() },
        }).unwrap();
        setNewModuleTitle("");
        toast.success("Module added successfully");
      } catch (err) {
        toast.error("Failed to add module");
      }
    }
  };

  const openAddContentModal = (moduleId) => {
    setTargetModuleId(moduleId);
    setEditingLessonId(null);
    setIsModalOpen(true);
  };

  const openEditContentModal = (moduleId, lessonId) => {
    setTargetModuleId(moduleId);
    setEditingLessonId(lessonId);
    setIsModalOpen(true);
  };

  const handleRemoveModule = (moduleId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[300px]">
          <div className="flex items-center gap-2 text-stone-800">
            <X className="w-5 h-5 text-red-500" />
            <span className="font-bold arimo-font text-sm">
              Delete this module?
            </span>
          </div>
          <p className="text-xs text-stone-500 inter-font">
            Deleting this module will remove all its lessons. This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-stone-600 transition-all rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteModule({
                    course_pk: courseId,
                    id: moduleId,
                  }).unwrap();
                  toast.success("Module deleted");
                } catch (err) {
                  toast.error("Failed to delete module");
                }
              }}
              className="px-4 py-2 text-xs font-bold bg-red-500 text-white hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000, position: "top-center" },
    );
  };

  const openLessonDetails = (lesson) => {
    setSelectedLesson(lesson);
    setIsDetailsOpen(true);
  };

  if (!courseId) {
    return (
      <div className="bg-stone-50 p-12 rounded-[2rem] border border-stone-200 border-dashed text-center space-y-6">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-stone-100">
          <Zap className="w-8 h-8 text-stone-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-stone-800 arimo-font">
            Setup Curriculum
          </h3>
          <p className="text-stone-500 text-sm inter-font max-w-sm mx-auto">
            Before you can add modules and lessons, you need to save the basic
            course information.
          </p>
        </div>

        <button
          onClick={onInitialize}
          className="bg-greenTeal hover:bg-teal-700 text-white px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-2 mx-auto shadow-lg shadow-teal-900/10 active:scale-95 inter-font"
        >
          <Save className="w-5 h-5" />
          <span>Save Overview & Start Building</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Modules List */}
      <div className="space-y-6">
        {isLoadingModules ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : modules.length > 0 ? (
          modules.map((mod) => (
            <ModuleItem
              key={mod.id}
              mod={mod}
              courseId={courseId}
              onAddLesson={openAddContentModal}
              onEditLesson={openEditContentModal}
              onRemoveModule={handleRemoveModule}
              onLessonDetails={openLessonDetails}
            />
          ))
        ) : (
          <div className="py-12 text-center text-stone-400 text-sm font-medium border-2 border-dashed border-stone-100 rounded-[2rem]">
            No modules added yet. Start by adding a module below.
          </div>
        )}
      </div>

      {/* Add New Module Section */}
      <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 mt-4 space-y-4">
        <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest inter-font">
          Add New Module
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Module title (e.g., Understanding Anxiety)"
            className="flex-1 bg-white border border-stone-200 rounded-2xl px-6 py-3.5 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
            onKeyDown={(e) => e.key === "Enter" && addModule()}
          />
          <button
            onClick={addModule}
            disabled={isCreatingModule}
            className="bg-greenTeal hover:bg-teal-700 text-white px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg shadow-teal-900/10 active:scale-95 inter-font disabled:opacity-50"
          >
            {isCreatingModule ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            <span>Add Module</span>
          </button>
        </div>
      </div>

      <AddContentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLessonId(null);
        }}
        moduleId={targetModuleId}
        courseId={courseId}
        lessonId={editingLessonId}
      />

      {/* Lesson Details Viewer Modal */}
      <LessonDetailsModal
        isOpen={isDetailsOpen}
        lesson={selectedLesson}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedLesson(null);
        }}
      />
    </div>
  );
};

export default CourseCurriculum;
