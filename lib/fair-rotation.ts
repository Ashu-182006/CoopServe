/**
 * Fair Job Rotation algorithm
 *
 * F = w1 * proximity + w2 * rating_norm + w3 * idle_norm
 * Weights: w1=0.4, w2=0.4, w3=0.2
 */

export interface WorkerCandidate {
  workerId: string;
  distanceKm: number;
  bayesianAvg: number;      // 1–5
  lastJobCompletedAt: Date | null;
  certificationStatus: boolean;
  certJoinedAt: Date | null;
}

export interface RankedWorker extends WorkerCandidate {
  score: number;
  scoreBreakdown: {
    proximity: number;
    ratingNorm: number;
    idleNorm: number;
    certPenalty: number;
    final: number;
  };
}

const MAX_RADIUS_KM = 10;
const W1 = 0.4; // proximity weight
const W2 = 0.4; // rating weight
const W3 = 0.2; // idle time weight

function proximityScore(distanceKm: number): number {
  return Math.max(0, Math.min(1, 1 - distanceKm / MAX_RADIUS_KM));
}

function ratingNorm(bayesianAvg: number): number {
  return Math.max(0, Math.min(1, (bayesianAvg - 1) / 4));
}

function idleNorm(lastJobCompletedAt: Date | null): number {
  if (!lastJobCompletedAt) return 1; // never worked → max idle score
  const idleMinutes = (Date.now() - lastJobCompletedAt.getTime()) / 60_000;
  return Math.min(1, idleMinutes / 240);
}

function certificationPenalty(
  certificationStatus: boolean,
  certJoinedAt: Date | null,
): number {
  if (certificationStatus) return 1; // no penalty
  if (!certJoinedAt) return 0.65;    // unknown join date → conservative penalty
  const daysSinceJoin = (Date.now() - certJoinedAt.getTime()) / 86_400_000;
  return daysSinceJoin <= 90 ? 0.85 : 0.65;
}

export function scoreWorker(worker: WorkerCandidate): RankedWorker {
  const proximity  = proximityScore(worker.distanceKm);
  const rating     = ratingNorm(worker.bayesianAvg);
  const idle       = idleNorm(worker.lastJobCompletedAt);
  const certFactor = certificationPenalty(
    worker.certificationStatus,
    worker.certJoinedAt,
  );

  const raw   = W1 * proximity + W2 * rating + W3 * idle;
  const final = raw * certFactor;

  return {
    ...worker,
    score: final,
    scoreBreakdown: {
      proximity,
      ratingNorm: rating,
      idleNorm:   idle,
      certPenalty: certFactor,
      final,
    },
  };
}

/**
 * Rank a list of workers by Fair Rotation score (descending).
 */
export function rankWorkers(candidates: WorkerCandidate[]): RankedWorker[] {
  return candidates.map(scoreWorker).sort((a, b) => b.score - a.score);
}
