export function visibleContentWhere(include_hidden = false) {
  return include_hidden ? {} : { is_hidden: false };
}
