// Plain-language labels for Lulu print format ids.
// An id looks like 0600X0900.FC.STD.PB.060UW444.MXX:
//   trim size . colour . quality . binding . paper . cover finish

const BINDINGS = {
  PB: "Paperback",
  CW: "Hardcover",
  CO: "Coil bound",
  SS: "Saddle stitch (booklet)",
  LW: "Linen wrap hardcover",
  WO: "Wire-O",
};
const COLORS = { BW: "Black & white", FC: "Full colour" };
const QUALITY = { STD: "Standard", PRE: "Premium" };
const FINISH = { MXX: "matte cover", GXX: "gloss cover" };
const PAPER_TYPE = { UW: "uncoated white", UC: "uncoated cream", CW: "coated white" };

const KNOWN_TRIMS = {
  "0827X1169": 'A4 (8.27 x 11.69")',
  "0583X0827": 'A5 (5.83 x 8.27")',
};

const trimLabel = (code) => {
  if (KNOWN_TRIMS[code]) return KNOWN_TRIMS[code];
  const match = /^(\d{4})X(\d{4})$/.exec(code || "");
  if (!match) return code || "";
  const w = Number(match[1]) / 100;
  const h = Number(match[2]) / 100;
  return `${w} x ${h}"`;
};

const paperLabel = (code) => {
  const match = /^(\d{3})([A-Z]{2})\d*$/.exec(code || "");
  if (!match) return code || "";
  const weight = Number(match[1]);
  return `${weight}# ${PAPER_TYPE[match[2]] || match[2]} paper`;
};

/** "6 x 9", full colour, standard, paperback, 60# uncoated white paper, matte cover" */
export const parsePackageId = (id) => {
  const [trim, color, quality, binding, paper, finish] = (id || "").split(".");
  if (!trim || !binding) return id || "";
  return [
    trimLabel(trim),
    COLORS[color] || color,
    QUALITY[quality] || quality,
    BINDINGS[binding] || binding,
    paperLabel(paper),
    FINISH[finish] || finish,
  ]
    .filter(Boolean)
    .join(", ");
};

/** Prefer the curated description from the server list; otherwise parse the id. */
export const describePackage = (id, curated = []) => {
  if (!id) return "";
  const match = curated.find((p) => p.id === id);
  return match ? match.description : parsePackageId(id);
};

export const packageParts = (id) => {
  const [, color, , binding] = (id || "").split(".");
  return { color, binding };
};

export const BINDING_LABELS = BINDINGS;
export const COLOR_LABELS = COLORS;
