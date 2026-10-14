export function cn(...names: Array<string | false | undefined | null>) {
  return names.filter(Boolean).join(" ");
}
