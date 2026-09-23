/** "12345678909" → "123.456.789-09". */
export function formatCpf(digits: string) {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/** "91999990000" → "(91) 99999-0000"; 10 digits → "(91) 9999-0000". */
export function formatPhone(digits: string) {
  return digits.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
}
