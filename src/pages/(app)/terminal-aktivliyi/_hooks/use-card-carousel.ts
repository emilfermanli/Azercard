import { useCallback, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

/**
 * Yuxarı kartlar üçün carousel — hər 2 saniyədən bir avtomatik dövr (loop),
 * istifadəçi əl ilə də idarə edə bilir. Slide sayı dəyişəndə yenidən qurulur.
 */
export function useCardCarousel(slideCount: number) {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [
    autoplayPlugin.current,
  ]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Kartlar (async) gələndə carousel-i yenidən qur.
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, slideCount]);

  return { emblaRef, scrollPrev, scrollNext };
}
