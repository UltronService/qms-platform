/**
 * Shared history list pagination math (store + tests; mirror in admin TS).
 */
(function (root) {
  'use strict';

  const QMS = (root.QMS = root.QMS || {});

  const MIN_PAGE_SIZE = 3;

  /**
   * @param {number} availableHeight
   * @param {number} rowHeight
   * @returns {number}
   */
  function computePageSize(availableHeight, rowHeight) {
    if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
      return MIN_PAGE_SIZE;
    }
    if (!Number.isFinite(rowHeight) || rowHeight <= 0) {
      return MIN_PAGE_SIZE;
    }
    return Math.max(MIN_PAGE_SIZE, Math.floor(availableHeight / rowHeight));
  }

  /**
   * @param {number} total
   * @param {number} pageSize
   * @returns {number}
   */
  function computePageCount(total, pageSize) {
    const size = pageSize > 0 ? pageSize : MIN_PAGE_SIZE;
    if (total <= 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(total / size));
  }

  /**
   * @param {number} page
   * @param {number} pageCount
   * @returns {number}
   */
  function clampHistoryPage(page, pageCount) {
    const count = pageCount > 0 ? pageCount : 1;
    if (!Number.isFinite(page) || page < 1) {
      return 1;
    }
    if (page > count) {
      return count;
    }
    return page;
  }

  /**
   * @param {number} total
   * @param {number} blockHeight
   * @param {number} rowHeight
   * @param {number} pagerRowHeight
   * @returns {{ pageSize: number, pageCount: number, showPager: boolean }}
   */
  function computeHistoryPagination(total, blockHeight, rowHeight, pagerRowHeight) {
    const safePager = Number.isFinite(pagerRowHeight) && pagerRowHeight > 0 ? pagerRowHeight : 0;
    let available = blockHeight;
    let pageSize = computePageSize(available, rowHeight);
    let pageCount = computePageCount(total, pageSize);

    if (pageCount > 1 && safePager > 0) {
      available = blockHeight - safePager;
      pageSize = computePageSize(available, rowHeight);
      pageCount = computePageCount(total, pageSize);
    }

    return {
      pageSize: pageSize,
      pageCount: pageCount,
      showPager: pageCount > 1,
    };
  }

  /**
   * Newest-first history; page p shows indices (p-1)*pageSize .. min(total, p*pageSize)-1.
   * @param {string[]} history
   * @param {number} page
   * @param {number} pageSize
   * @returns {string[]}
   */
  function sliceHistoryPage(history, page, pageSize) {
    if (!history || history.length === 0) {
      return [];
    }
    const start = (page - 1) * pageSize;
    if (start >= history.length) {
      return [];
    }
    const end = Math.min(history.length, page * pageSize);
    return history.slice(start, end);
  }

  /**
   * @param {Record<string, unknown>} queue
   * @returns {number}
   */
  function resolveHistoryPageIntervalSec(queue) {
    const source = queue || {};
    const raw = Number(
      source.historyPageIntervalSec != null
        ? source.historyPageIntervalSec
        : source.historyCarouselIntervalSec,
    );
    if (!Number.isFinite(raw)) {
      return 6;
    }
    return Math.max(3, Math.min(30, Math.round(raw)));
  }

  QMS.MIN_HISTORY_PAGE_SIZE = MIN_PAGE_SIZE;
  QMS.computePageSize = computePageSize;
  QMS.computePageCount = computePageCount;
  QMS.clampHistoryPage = clampHistoryPage;
  QMS.computeHistoryPagination = computeHistoryPagination;
  QMS.sliceHistoryPage = sliceHistoryPage;
  QMS.resolveHistoryPageIntervalSec = resolveHistoryPageIntervalSec;
})(typeof window !== 'undefined' ? window : globalThis);
