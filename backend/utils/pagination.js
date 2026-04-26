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

module.exports = { paginate };