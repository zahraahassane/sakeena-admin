export const inputClass = (hasError) =>
  `w-full h-11 px-3 bg-zinc-50 border rounded-xl outline-none text-sm placeholder:text-gray-400 transition-all focus:bg-white focus:ring-2 ${
    hasError
      ? "border-rose-300 focus:ring-rose-200"
      : "border-black/10 focus:ring-teal-600/15"
  }`;
