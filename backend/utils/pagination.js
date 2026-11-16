/**
 * Helper function to implement pagination with hasNext flag using pageSize+1 trick
 * @param {Array} results - The query results array
 * @param {number} page - Current page number (0-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Paginated results with hasNext flag
 */
function paginate(results, page, pageSize) {
  // If we have more results than pageSize, we know there's a next page
  const hasNext = results.length > pageSize;
  
  // If there's a next page, remove the extra item we used for checking
  const data = hasNext ? results.slice(0, pageSize) : results;
  
  return {
    hasNext,
    items: data
  };
}

// Retorna 400 para paginação inválida antes de construir uma consulta ao banco.
function parsePagination(query) {
  const rawPage = query.page === undefined ? '0' : String(query.page);
  const rawSize = query.pageSize === undefined ? '10' : String(query.pageSize);
  if (!/^(0|[1-9]\\d*)$/.test(rawPage) || !/^[1-9]\\d*$/.test(rawSize)) {
    return null;
  }
  const pageNum = Number(rawPage);
  const size = Number(rawSize);
  if (!Number.isSafeInteger(pageNum) || pageNum > 1000000 ||
      !Number.isSafeInteger(size) || size > 100) {
    return null;
  }
  return { pageNum, size };
}

module.exports = { paginate, parsePagination };