module.exports = (filters) => {
  let filterQuery = "AND ";
  filters.filter(el => ["eq", "gt", "gte", "lt", "lte"].includes(el.operator)).forEach((filter, ind, arr) => {
    const value = (typeof filter.property_value === "string" ? `'${filter.property_value.replace(/'/g, "''")}'` : filter.property_value);
    if (filter.operator === "eq") {
      filterQuery += `"${filter.property_name}" = ${value}`;
    } else if (filter.operator === "lt") {
      filterQuery += `"${filter.property_name}" < ${value}`;
    } else if (filter.operator === "lte") {
      filterQuery += `"${filter.property_name}" <= ${value}`;
    } else if (filter.operator === "gt") {
      filterQuery += `"${filter.property_name}" > ${value}`;
    } else if (filter.operator === "gte") {
      filterQuery += `"${filter.property_name}" >= ${value}`;
    }
    if (ind !== arr.length - 1) filterQuery += " AND ";
  });
  return filterQuery !== "AND " ? filterQuery : "";
};
