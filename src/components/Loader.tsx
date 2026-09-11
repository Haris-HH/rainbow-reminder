import { useId } from 'react'

type LoaderProps = {
  /** Optional text shown beneath the animation. */
  label?: string
}

/**
 * Animated water-pickup-truck loading indicator: a pickup hauling a water
 * tank on its bed, painted in the app's own brand palette (purple cab,
 * crimson accent stripe, blue/sky water tank — the same colors as the
 * rainbow logo and primary buttons). Gradients are generated per-instance
 * with useId so multiple loaders on a page don't clash; flat colors are
 * driven by theme CSS variables in `.truck-loader` (index.css) so it
 * repaints with light/dark and the glass/solid/vibrant style variants.
 * Adapted from the uiverse.io/vinodjangid07 truck-loader animation shell
 * (MIT); the artwork itself is original.
 */
export function Loader({ label }: LoaderProps) {
  const uid = useId()
  const cabGradId = `${uid}-cab`
  const tankGradId = `${uid}-tank`

  return (
    <div className="loader-box">
      <div className="truck-loader" role="status" aria-label={label ?? 'Loading'}>
        <div className="truckWrapper">
          <div className="truckBody">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 198 93"
              className="trucksvg"
            >
              <defs>
                <linearGradient id={cabGradId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--purple)" />
                  <stop offset="100%" stopColor="var(--purple-soft)" />
                </linearGradient>
                <linearGradient id={tankGradId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--blue)" />
                  <stop offset="100%" stopColor="var(--sky)" />
                </linearGradient>
              </defs>

              {/* wheel-arch shading */}
              <ellipse className="wt-shadow" cx="40" cy="70" rx="18" ry="6" />
              <ellipse className="wt-shadow" cx="165" cy="70" rx="18" ry="6" />

              {/* pickup bed */}
              <rect className="wt-navy" x="10" y="50" width="118" height="14" rx="3" />
              <rect className="wt-accent" x="10" y="46" width="118" height="5" rx="2" />
              <rect className="wt-navy" x="124" y="20" width="10" height="50" rx="2" />
              <rect className="wt-navy" x="4" y="48" width="8" height="22" rx="2" />

              {/* water tank on the bed */}
              <rect
                className="wt-tank"
                x="18"
                y="18"
                width="100"
                height="32"
                rx="16"
                strokeWidth="2.5"
                fill={`url(#${tankGradId})`}
              />
              <rect className="wt-band" x="58" y="18" width="10" height="32" rx="2" />
              <rect className="wt-band" x="90" y="18" width="6" height="32" rx="2" opacity="0.6" />
              <ellipse className="wt-highlight" cx="42" cy="27" rx="22" ry="6" />
              <path
                className="wt-droplet"
                strokeWidth="1.5"
                d="M98,27 C103,32.5 103,37 98,39.5 C93,37 93,32.5 98,27 Z"
              />

              {/* cab + hood */}
              <path
                className="wt-cab"
                strokeWidth="2.5"
                fill={`url(#${cabGradId})`}
                d="M134,70 L134,40 Q134,34 140,34 L162,34 L182,50 L194,50 Q196,50 196,53 L196,70 Z"
              />
              <polygon
                className="wt-glass"
                strokeWidth="1.5"
                points="140,38 160,38 178,51 145,51"
              />
              <line className="wt-navy-line" x1="158" y1="40" x2="158" y2="70" strokeWidth="1.5" />
              <rect className="wt-navy" x="150" y="53" width="6" height="2.5" rx="1" />
              <rect className="wt-navy" x="136" y="42" width="4" height="3" rx="1" />
              <rect className="wt-light" x="190" y="56" width="5" height="6" rx="1.5" />
              <rect className="wt-navy" x="192" y="66" width="5" height="8" rx="1.5" />

              {/* rear step */}
              <rect className="wt-shadow-solid" x="0" y="72" width="8" height="5" rx="1.5" />
            </svg>
          </div>
          <div className="truckTires">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 30 30"
              className="tiresvg"
            >
              <circle className="wt-tire" strokeWidth="3" r="13.5" cy="15" cx="15" />
              <circle className="wt-hub" r="7" cy="15" cx="15" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 30 30"
              className="tiresvg"
            >
              <circle className="wt-tire" strokeWidth="3" r="13.5" cy="15" cx="15" />
              <circle className="wt-hub" r="7" cy="15" cx="15" />
            </svg>
          </div>
          <div className="road" />
          <svg
            xmlSpace="preserve"
            viewBox="0 0 453.459 453.459"
            xmlns="http://www.w3.org/2000/svg"
            id="Capa_1"
            version="1.1"
            className="lampPost"
          >
            <path d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017h78.747C231.693,100.736,232.77,106.162,232.77,111.694z" />
          </svg>
        </div>
      </div>
      {label && <p className="loader-box__label">{label}</p>}
    </div>
  )
}
