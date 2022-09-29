export function replaceUID(path: string, uid: string) {
  return path.replace(/{UID}/g, uid);
}
