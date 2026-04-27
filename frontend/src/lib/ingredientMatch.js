// Levenshtein distance + fuzzy ingredient matching
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

// Returns canonical name if close enough, else null
export function fuzzyMatch(input, candidates) {
  const q = input.trim().toLowerCase();
  if (!q || !candidates.length) return null;

  const exact = candidates.find(c => c.toLowerCase() === q);
  if (exact) return exact;

  const starts = candidates.find(c => c.toLowerCase().startsWith(q));
  if (starts && q.length >= 3) return starts;

  const tol = q.length <= 4 ? 1 : 2;
  let best = null, bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(q, c.toLowerCase());
    if (d < bestDist) { best = c; bestDist = d; }
  }
  return bestDist <= tol ? best : null;
}

export function ingredientImgUrl(name, size = "small") {
  const slug = name.trim().replace(/\s+/g, "%20");
  const suffix = size === "small" ? "-Small" : size === "medium" ? "-Medium" : "";
  return `https://www.thecocktaildb.com/images/ingredients/${slug}${suffix}.png`;
}
