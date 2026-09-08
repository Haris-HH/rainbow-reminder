import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type LoadingScreenProps = {
  /** URL of the logo image. Served from /public. */
  logoUrl?: string
  /** Text shown beneath the animation. */
  label?: string
}

/**
 * Full-screen 3D loading animation: the app logo (with its white background
 * keyed out) floats above an animated, rippling water surface and casts a
 * soft reflection. The logo itself does not spin — all motion comes from the
 * water waves and a gentle vertical bob.
 *
 * Built on three.js core only. Fully self-cleaning; respects
 * prefers-reduced-motion.
 */
export function LoadingScreen({ logoUrl = '/logo-3d.jpg', label }: LoadingScreenProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false

    // ---- renderer ----------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    // ---- scene + camera (slightly elevated, looking down at the water) -----
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 1.35, 6.2)
    camera.lookAt(0, 0.1, 0)

    // ---- logo (white background keyed out) + reflection --------------------
    const logoMat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
    })
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), logoMat)
    logo.position.set(0, 0.4, 0)
    logo.renderOrder = 2
    scene.add(logo)

    // Mirrored, faded copy sitting on the water as a reflection.
    const reflMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      depthTest: false,
    })
    const reflection = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), reflMat)
    reflection.scale.y = -1 // flip vertically
    reflection.position.set(0, -1.87, 0)
    reflection.renderOrder = 1
    scene.add(reflection)

    // Key out the near-white background on a canvas, then feed both meshes.
    const img = new Image()
    img.onload = () => {
      if (disposed) return
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const W = c.width
      const H = c.height
      const id = ctx.getImageData(0, 0, W, H)
      const px = id.data
      const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i]
        const gch = px[i + 1]
        const b = px[i + 2]
        const max = Math.max(r, gch, b)
        const min = Math.min(r, gch, b)
        const sat = max === 0 ? 0 : (max - min) / max
        let alphaMul = 1
        // Neutral WHITE background (incl. JPEG-tinted off-white): bright + low sat.
        if (max > 196 && sat < 0.22) {
          const t = clamp01((max - 196) / 44) * clamp01(1 - sat / 0.22)
          alphaMul *= 1 - t
        }
        // Neutral DARK footer bar: near-black + low saturation.
        if (max < 95 && sat < 0.4) {
          const t = clamp01((95 - max) / 45) * clamp01(1 - sat / 0.4)
          alphaMul *= 1 - t
        }
        // Saturated colours (red rainbow, blue waves) are untouched by keying.
        // Dissolve the logo's lower wave band into the real animated water.
        const yNorm = Math.floor(i / 4 / W) / H
        if (yNorm > 0.58) {
          alphaMul *= clamp01(1 - (yNorm - 0.58) / 0.34)
        }
        px[i + 3] = Math.round(px[i + 3] * alphaMul)
      }
      ctx.putImageData(id, 0, 0)

      const logoTex = new THREE.CanvasTexture(c)
      logoTex.colorSpace = THREE.SRGBColorSpace
      logoTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      const reflTex = new THREE.CanvasTexture(c)
      reflTex.colorSpace = THREE.SRGBColorSpace

      logoMat.map = logoTex
      logoMat.needsUpdate = true
      reflMat.map = reflTex
      reflMat.needsUpdate = true
    }
    img.src = logoUrl

    // ---- resize ------------------------------------------------------------
    const resize = () => {
      const w = mount.clientWidth || 320
      const h = mount.clientHeight || 320
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = `${w}px`
      renderer.domElement.style.height = `${h}px`
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // ---- animation loop ----------------------------------------------------
    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      if (!reduceMotion) {
        const bob = Math.sin(t * 1.3) * 0.07
        logo.position.y = 0.4 + bob
        reflection.position.y = -1.87 - bob
        if (reflMat.map) reflMat.map.offset.x = Math.sin(t * 0.9) * 0.01
      }
      renderer.render(scene, camera)
    }
    tick()

    // ---- cleanup -----------------------------------------------------------
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.remove()
      renderer.dispose()
      logo.geometry.dispose()
      reflection.geometry.dispose()
      logoMat.map?.dispose()
      reflMat.map?.dispose()
      logoMat.dispose()
      reflMat.dispose()
    }
  }, [logoUrl])

  return (
    <div className="loading-screen">
      <div ref={mountRef} className="loading-screen__stage" />
      {label && (
        <p className="loading-screen__label">
          {label}
          <span className="loading-screen__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
      )}
    </div>
  )
}
