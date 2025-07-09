import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  className?: string;
  threshold?: number;
  itemsPerLoad?: number;
}

function InfiniteScroll<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  loading,
  className = '',
  threshold = 100,
  itemsPerLoad = 24
}: InfiniteScrollProps<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize displayed items
  useEffect(() => {
    if (items.length > 0) {
      const initialItems = items.slice(0, Math.min(itemsPerLoad, items.length));
      setDisplayedItems(initialItems);
      setCurrentIndex(initialItems.length);
    } else {
      setDisplayedItems([]);
      setCurrentIndex(0);
    }
  }, [items, itemsPerLoad]);

  // Load more items function
  const loadMoreItems = useCallback(() => {
    if (localLoading || loading || !hasMore || currentIndex >= items.length) return;
    
    setLocalLoading(true);
    
    setTimeout(() => {
      const nextItems = items.slice(currentIndex, currentIndex + itemsPerLoad);
      if (nextItems.length > 0) {
        setDisplayedItems(prev => [...prev, ...nextItems]);
        setCurrentIndex(prev => prev + nextItems.length);
      }
      setLocalLoading(false);
    }, 300); // Small delay for smooth UX
  }, [items, currentIndex, itemsPerLoad, hasMore, loading, localLoading]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const target = entries[0];
          if (target.isIntersecting && hasMore && !loading && !localLoading) {
            loadMoreItems();
          }
        },
        {
          threshold: 0.1,
          rootMargin: `${threshold}px`
        }
      );

      if (observerRef.current) {
        observer.observe(observerRef.current);
      }

      return () => {
        if (observerRef.current) {
          observer.unobserve(observerRef.current);
        }
      };
    } else {
      // Fallback for browsers that don't support Intersection Observer
      console.log('IntersectionObserver not supported, using scroll event');
      const handleScroll = () => {
        if (containerRef.current) {
          const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
          if (scrollHeight - scrollTop - clientHeight < threshold) {
            loadMoreItems();
          }
        }
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [loadMoreItems, hasMore, loading, localLoading, threshold]);

  // Manual scroll handler for older browsers or as a fallback
  const handleScroll = useCallback(() => {
    if (!containerRef.current || localLoading || loading || !hasMore) return;
    
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loadMoreItems();
    }
  }, [loadMoreItems, hasMore, loading, localLoading, threshold]);

  // Add scroll event listener
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  const shouldShowMore = currentIndex < items.length;

  return (
    <div 
      ref={containerRef}
      className={`infinite-scroll-container ${className}`}
      style={{ maxHeight: '100%', overflowY: 'auto' }}
    >
      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {displayedItems.map((item, index) => (
          <div key={index} className="card-uniform">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading indicator and observer target */}
      {shouldShowMore && (
        <div 
          ref={observerRef}
          className="flex justify-center items-center py-8"
        >
          {(loading || localLoading) ? (
            <div className="flex items-center space-x-2 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tải thêm...</span>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">
              Cuộn xuống để tải thêm {Math.min(itemsPerLoad, items.length - currentIndex)} mục...
            </div>
          )}
        </div>
      )}

      {/* End indicator */}
      {!shouldShowMore && items.length > 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Đã hiển thị tất cả {items.length} mục
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-2">Không có dữ liệu</div>
          <div className="text-sm text-slate-500">Thử thay đổi bộ lọc hoặc tìm kiếm</div>
        </div>
      )}
    </div>
  );
}

export default InfiniteScroll;