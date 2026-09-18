import { PageLoadingSkeleton } from "@/components/layout/PageLoadingSkeleton"

/*
 * The only dashboard route that is still rendered per request: its initial
 * render POSTs the default scenario to /simulate, which cannot be cached. With
 * this boundary the shell and skeleton paint immediately and the page streams
 * in when the backend answers, instead of the whole route waiting.
 */
export default function Loading() {
  return <PageLoadingSkeleton />
}
