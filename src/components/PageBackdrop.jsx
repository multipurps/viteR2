import './PageBackdrop.css';

// A fixed, full-viewport image layer that sits behind the whole page.
// It never scrolls — only the normal-flow content stacked on top of it
// moves — so the backdrop reads as a constant, edge-to-edge background
// for the entire page (SideNav included) rather than a hero banner
// that scrolls out of view. Pass multiple `images` + `activeIndex` for
// a crossfading rotation (Home/Movies/TV heroes); a single-item array
// just renders as a static backdrop (detail pages).
export default function PageBackdrop({ images = [], activeIndex = 0 }) {
  return (
    <div className="page-backdrop">
      {images.filter(Boolean).map((src, i) => (
        <img key={src} src={src} alt="" className={`page-backdrop-img${i === activeIndex ? ' on' : ''}`} />
      ))}
    </div>
  );
}
