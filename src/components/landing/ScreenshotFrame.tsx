import Image from "next/image"

export function ScreenshotFrame({
  src,
  alt,
  priority = false,
  objectPosition = "center",
  sizes = "(max-width: 1024px) 100vw, 720px",
}: {
  src: string
  alt: string
  priority?: boolean
  objectPosition?: string
  sizes?: string
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#DCE3ED] bg-[#F6F8FB] p-1.5 shadow-[0_28px_75px_rgba(15,23,42,0.13)] md:p-2">
      <div className="relative aspect-[3024/1718] overflow-hidden rounded-[9px] border border-[#E8EDF5] bg-white">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-contain"
          style={{ objectPosition }}
          sizes={sizes}
        />
      </div>
    </div>
  )
}
