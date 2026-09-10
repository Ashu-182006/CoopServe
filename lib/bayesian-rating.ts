/**
 * Bayesian Average Rating
 *
 * Bayesian = (c * m + n * r) / (c + n)
 *
 * c = 5 (confidence threshold)
 * m = platform-wide average rating
 * n = worker's number of real reviews
 * r = worker's simple average of real reviews
 */

const CONFIDENCE = 5; // c

export function computeBayesianAvg(
  nReviews: number,
  simpleAvg: number,
  platformAvg: number,
): number {
  if (nReviews === 0) return platformAvg; // no reviews yet → fall back to platform avg
  const bayesian = (CONFIDENCE * platformAvg + nReviews * simpleAvg) / (CONFIDENCE + nReviews);
  return Math.round(bayesian * 100) / 100; // round to 2 decimal places
}

/**
 * Compute new simple average when a new rating is added.
 * More efficient than re-fetching all ratings.
 */
export function updateSimpleAvg(
  currentSimpleAvg: number,
  currentNReviews: number,
  newScore: number,
): { newSimpleAvg: number; newNReviews: number } {
  const newNReviews  = currentNReviews + 1;
  const newSimpleAvg = (currentSimpleAvg * currentNReviews + newScore) / newNReviews;
  return {
    newSimpleAvg: Math.round(newSimpleAvg * 100) / 100,
    newNReviews,
  };
}
