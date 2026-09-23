export const MIN_HISTORY_PAGE_SIZE = 3;

export function computePageSize(availableHeight: number, rowHeight: number): number {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
    return MIN_HISTORY_PAGE_SIZE;
  }
  if (!Number.isFinite(rowHeight) || rowHeight <= 0) {
    return MIN_HISTORY_PAGE_SIZE;
  }
  return Math.max(MIN_HISTORY_PAGE_SIZE, Math.floor(availableHeight / rowHeight));
}

export function computePageCount(total: number, pageSize: number): number {
  const size = pageSize > 0 ? pageSize : MIN_HISTORY_PAGE_SIZE;
  if (total <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / size));
}

export function clampHistoryPage(page: number, pageCount: number): number {
  const count = pageCount > 0 ? pageCount : 1;
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  if (page > count) {
    return count;
  }
  return page;
}

export function computeHistoryPagination(
  total: number,
  blockHeight: number,
  rowHeight: number,
  pagerRowHeight: number,
): { pageSize: number; pageCount: number; showPager: boolean } {
  const safePager =
    Number.isFinite(pagerRowHeight) && pagerRowHeight > 0 ? pagerRowHeight : 0;
  let available = blockHeight;
  let pageSize = computePageSize(available, rowHeight);
  let pageCount = computePageCount(total, pageSize);

  if (pageCount > 1 && safePager > 0) {
    available = blockHeight - safePager;
    pageSize = computePageSize(available, rowHeight);
    pageCount = computePageCount(total, pageSize);
  }

  return {
    pageSize,
    pageCount,
    showPager: pageCount > 1,
  };
}

export function sliceHistoryPage(
  history: string[],
  page: number,
  pageSize: number,
): string[] {
  if (history.length === 0) {
    return [];
  }
  const start = (page - 1) * pageSize;
  if (start >= history.length) {
    return [];
  }
  const end = Math.min(history.length, page * pageSize);
  return history.slice(start, end);
}
