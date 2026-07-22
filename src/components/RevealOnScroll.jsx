// No-op wrapper — content used to lift/translate in on scroll, which
// read as the page "moving around" while scrolling. Just render
// children directly now, no animation, no IntersectionObserver.
export default function RevealOnScroll({ children }) {
  return children;
}
