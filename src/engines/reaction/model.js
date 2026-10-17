function protocol(kind) {
  return {
    durationMs: 30000,
    waitMin: kind === 'pvt' ? 1000 : 500,
    waitMax: kind === 'pvt' ? 3000 : 500,
    windowMs: kind === 'pvt' ? 10000 : 1500,
    visibleMs: kind === 'pvt' ? 10000 : kind === 'gonogo' ? 500 : 1500,
  };
}
function outcome(kind, trial) {
  if (kind === 'gonogo' && trial.target === 1)
    return trial.answer === null ? 'withheld' : 'commission';
  if (trial.answer === null) return 'omission';
  if (trial.rtMs < 100) return 'premature';
  return trial.answer === trial.target ? 'hit' : 'wrong';
}
const correct = (kind, trial) => ['hit', 'withheld'].includes(outcome(kind, trial));
const summarize = (kind, trials) => ({
  score: trials.filter((trial) => correct(kind, trial)).length,
});
export const ReactionModel = Object.freeze({ protocol, outcome, correct, summarize });
