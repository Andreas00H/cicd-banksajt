// MEDVETET FEL (Del 3 i uppgiften): den här filen ska få CI att misslyckas.
// <img> saknar alt-text och använder inte Next.js <Image>, vilket ger lint-varningar.
export default function Page() {
  return <img src="/test.jpg" />;
}
