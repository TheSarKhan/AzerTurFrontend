// Spring Boot rounds each converted service line before adding the group total.
export function convertedServiceTotal(
  amounts: number[],
  exchangeRate: number,
): number {
  return amounts.reduce(
    (sum, amount) => sum + Math.round(amount * exchangeRate),
    0,
  );
}
