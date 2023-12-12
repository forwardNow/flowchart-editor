export function toFixedNumber(target: number, fractionDigits = 2) {
  return parseFloat(target.toFixed(fractionDigits));
}
