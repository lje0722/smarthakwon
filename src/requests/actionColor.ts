/** action 이름별 배지 색. 휴원/퇴원 배지와 같은 톤(연한 배경 + 테두리)으로 튀지 않게 맞춘다. */
const ACTION_BADGE_PALETTE = [
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-lime-50 text-lime-700 border-lime-200',
];

/** 같은 action 이름은 항상 같은 색으로 나오도록 문자열을 해시해 팔레트에서 고른다. */
export const actionBadgeClass = (action: string): string => {
  let hash = 0;
  for (let i = 0; i < action.length; i++) {
    hash = (hash * 31 + action.charCodeAt(i)) >>> 0;
  }
  return ACTION_BADGE_PALETTE[hash % ACTION_BADGE_PALETTE.length];
};
