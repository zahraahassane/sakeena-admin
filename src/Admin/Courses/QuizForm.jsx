import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import TextEditor from "../../components/Editor";

const QuizForm = ({ data, onChange }) => {
  const updateQuiz = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      text: "",
      options: [""],
      correctAnswer: 0,
      points: 10,
    };
    updateQuiz("questions", [...(data.questions || []), newQuestion]);
  };

  const addOption = (qId) => {
    const updatedQuestions = data.questions.map((q) => {
      if (q.id === qId && q.options.length < 4) {
        return { ...q, options: [...q.options, ""] };
      }
      return q;
    });
    updateQuiz("questions", updatedQuestions);
  };

  const removeOption = (qId, optIdx) => {
    const updatedQuestions = data.questions.map((q) => {
      if (q.id === qId && q.options.length > 1) {
        const newOptions = q.options.filter((_, idx) => idx !== optIdx);
        let newCorrect = q.correctAnswer;
        if (newCorrect >= newOptions.length) newCorrect = 0;
        return { ...q, options: newOptions, correctAnswer: newCorrect };
      }
      return q;
    });
    updateQuiz("questions", updatedQuestions);
  };

  const updateQuestion = (qId, field, value) => {
    const updatedQuestions = data.questions.map((q) =>
      q.id === qId ? { ...q, [field]: value } : q,
    );
    updateQuiz("questions", updatedQuestions);
  };

  const updateOption = (qId, optIdx, value) => {
    const updatedQuestions = data.questions.map((q) => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIdx] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    updateQuiz("questions", updatedQuestions);
  };

  const removeQuestion = (qId) => {
    updateQuiz(
      "questions",
      data.questions.filter((q) => q.id !== qId),
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Limit */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            value={data.timeLimit || 30}
            onChange={(e) => updateQuiz("timeLimit", e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
          />
        </div>

        {/* Passing Score */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
            Passing Score (%)
          </label>
          <input
            type="number"
            value={data.passingScore || 70}
            onChange={(e) => updateQuiz("passingScore", e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
          />
        </div>
      </div>

      {/* Attempts and review settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
            Total attempts allowed
          </label>
          <input
            type="number"
            min="1"
            value={data.maxAttempts ?? ""}
            onChange={(e) => updateQuiz("maxAttempts", e.target.value)}
            placeholder="Blank = unlimited"
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-stone-800 inter-font"
          />
          <p className="text-xs text-stone-500 ml-1 inter-font">
            2 = one retake after a fail. A student who passes cannot retake.
          </p>
        </div>

        <div className="space-y-4 md:pt-8">
          <label className="flex items-center gap-3 cursor-pointer inter-font text-sm font-bold text-stone-700">
            <input
              type="checkbox"
              checked={Boolean(data.shuffleOptions)}
              onChange={(e) => updateQuiz("shuffleOptions", e.target.checked)}
              className="w-5 h-5 accent-teal-600"
            />
            Shuffle answer options for each student
          </label>
          <label className="flex items-center gap-3 cursor-pointer inter-font text-sm font-bold text-stone-700">
            <input
              type="checkbox"
              checked={Boolean(data.showAnswers)}
              onChange={(e) => updateQuiz("showAnswers", e.target.checked)}
              className="w-5 h-5 accent-teal-600"
            />
            Show correct answers after each attempt
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700 ml-1 inter-font">
          Description
        </label>
        <TextEditor
          htmlElement={data.description || ""}
          onChange={(html) => updateQuiz("description", html)}
          isEditable={true}
        />
      </div>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-stone-800 arimo-font tracking-tight ml-1">
            Questions
          </h3>
        </div>

        <div className="space-y-6">
          {(data.questions || []).map((q, idx) => (
            <div
              key={q.id}
              className="bg-neutral-50 rounded-[2rem] border border-stone-200 p-8 space-y-6 relative group"
            >
              <button
                onClick={() => removeQuestion(q.id)}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </span>
                <h4 className="text-base font-bold text-stone-800 arimo-font">
                  Question {idx + 1}
                </h4>
              </div>

              <input
                type="text"
                value={q.text}
                onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                placeholder="Enter your question"
                className="w-full bg-white border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                    Answer Options
                  </label>
                  {q.options.length < 4 && (
                    <button
                      onClick={() => addOption(q.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg transition-all border border-teal-100/50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Option
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="flex items-center gap-3 group/opt"
                    >
                      {q.options.length > 1 && (
                        <button
                          onClick={() =>
                            updateQuestion(q.id, "correctAnswer", optIdx)
                          }
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                            q.correctAnswer === optIdx
                              ? "bg-blue-600 border-blue-600 shadow-md scale-110"
                              : "bg-white border-stone-300"
                          }`}
                        >
                          {q.correctAnswer === optIdx && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </button>
                      )}

                      {q.options.length === 1 ? (
                        <textarea
                          value={opt}
                          onChange={(e) =>
                            updateOption(q.id, optIdx, e.target.value)
                          }
                          placeholder="Enter the correct answer/key points"
                          rows={Math.max(2, opt.split("\n").length)}
                          className="flex-1 bg-white border border-stone-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium text-stone-800 inter-font resize-none scrollbar-hide"
                        />
                      ) : (
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            updateOption(q.id, optIdx, e.target.value)
                          }
                          placeholder={
                            q.options.length === 2
                              ? optIdx === 0
                                ? "True"
                                : "False"
                              : `Option ${optIdx + 1}`
                          }
                          className="flex-1 bg-white border border-stone-200 rounded-2xl px-6 py-3 outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-medium text-stone-800 inter-font"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        {q.correctAnswer === optIdx && q.options.length > 1 && (
                          <div className="hidden sm:flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase tracking-wider bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Correct</span>
                          </div>
                        )}
                        {q.options.length > 1 && (
                          <button
                            onClick={() => removeOption(q.id, optIdx)}
                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200/60">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                    Question Type:
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      q.options.length === 1
                        ? "bg-amber-100 text-amber-700"
                        : q.options.length === 2
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {q.options.length === 1
                      ? "Open-ended"
                      : q.options.length === 2
                        ? "True / False"
                        : "Multiple Choice"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                    Points:
                  </label>
                  <input
                    type="number"
                    value={q.points}
                    onChange={(e) =>
                      updateQuestion(q.id, "points", e.target.value)
                    }
                    className="w-24 bg-white border border-stone-200 rounded-xl px-4 py-2 outline-none focus:border-purple-400 font-bold text-stone-800 inter-font"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full py-4 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-stone-200 rounded-[2rem] text-stone-400 font-bold hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/30 transition-all group"
          >
            <div className="p-1 bg-stone-100 rounded-lg group-hover:bg-purple-100 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="arimo-font tracking-tight text-base">
              Add New Question
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizForm;
