export function computeAccessibleModules(entryModule: number, unlockedModules: number[]): number[] {
  return [...new Set(unlockedModules.filter((m) => m >= entryModule))];
}
