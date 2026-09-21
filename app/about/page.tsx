import Globe, { type GlobeMarker } from "@/components/lightswind/globe";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

const markers: GlobeMarker[] = [
  { location: [37.7749, -122.4194], size: 0.05, name: "San Francisco" },
  { location: [51.5072, -0.1276], size: 0.05, name: "UK" },
  { location: [35.6762, 139.6503], size: 0.05, name: "Tokyo" },
  { location: [-33.8688, 151.2093], size: 0.05, name: "Sydney" },
  { location: [52.52, 13.405], size: 0.05, name: "Germany" },
  { location: [43.8563, 18.4131], size: 0.05, name: "Bosnia and Herzegovina" },
];

export default function AboutPage() {
  return (
    <main className="collection-page blank-page">
      <SiteHeader />
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-copy">
          <p className="about-kicker">ABOUT TRIGER</p>
          <h1 id="about-title">
            Made for the <span>moment</span> before the strike.
          </h1>
          <p className="about-description">
            Triger makes hard-working lures for anglers who follow the water,
            trust their instincts, and stay out for one more cast.
          </p>
          <div className="about-details">
            <p>
              <strong>01</strong>
              Designed in motion
            </p>
            <p>
              <strong>02</strong>
              Tested worldwide
            </p>
          </div>
        </div>
        <div className="about-globe" aria-label="Triger community locations">
          <Globe
            markers={markers}
            baseColor="#4a4a4a"
            markerColor="#ff8c00"
            glowColor="#ff8c00"
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}